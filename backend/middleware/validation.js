import Joi from 'joi';

export const validateRegister = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('admin', 'user').default('user')
    });
    return schema.validate(data);
};

export const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    return schema.validate(data);
};

export const validateTeam = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(1).max(100).required(),
        description: Joi.string().max(500).allow('')
    });
    return schema.validate(data);
};

export const validateTask = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(255).required(),
        description: Joi.string().max(1000).allow(''),
        status: Joi.string().valid('pending', 'accepted', 'declined', 'in_progress', 'completed'),
        due_date: Joi.date().iso().allow('', null),
        team_id: Joi.number().integer().positive().required(),
        assignee_id: Joi.number().integer().positive().allow(null, '')
    });
    return schema.validate(data);
};