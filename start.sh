#!/bin/bash
set -e

cd backend

echo "Installing dependencies..."
npm install

echo "Starting server..."
npm start