import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import pgSession from 'connect-pg-simple';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db/pool.js';
import { findUserByEmail, findUserById } from './models/user.js';
import bcrypt from 'bcrypt';
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import taskRoutes from './routes/tasks.js';
import invitationRoutes from './routes/invitations.js';
import dashboardRoutes from './routes/dashboard.js';
import { initReminderJob } from './reminderService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const PgSession = pgSession(session);
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
    app.set('trust proxy', 1);
}

app.use(helmet({
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || !isProd) {
            return callback(null, true);
        }
        callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Increased limit for development/active testing
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, 
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health',
});

app.use(limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

const sessionStore = new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
        httpOnly: true,
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'lax',
    }
}));

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await findUserByEmail(email);
        if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await findUserById(id);
        if (!user) return done(null, false);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        session: req.sessionID ? 'active' : 'none'
    });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invitations', invitationRoutes);

if (isProd) {
    const frontendDist = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendDist));

    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
}

app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method
    });
});

app.use((err, req, res, next) => {
    console.error('ERROR:', err.stack);
    const message = isProd ? 'Internal server error' : err.message;
    res.status(err.status || 500).json({
        error: message,
        ...(isProd ? {} : { stack: err.stack })
    });
});

initReminderJob();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} [${isProd ? 'PROD' : 'DEV'}]`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Auth endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log(`Allowed origins:`, allowedOrigins);
});