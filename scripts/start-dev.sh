#!/bin/bash

echo "🚀 Starting Superteam Earn Telegram Bot in development mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please create .env file from .env.example and configure it"
    echo "   cp .env.example .env"
    exit 1
fi

# Check if required environment variables are set
source .env

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN not set in .env"
    echo "   Get your token from https://t.me/BotFather"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ DB_PASSWORD not set in .env"
    exit 1
fi

echo "✅ Environment configured"

# Build the project
echo "🔨 Building project..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Start the application
echo "🎯 Starting bot..."
echo "📱 Once running, you can test with: https://t.me/your_bot_username"
echo "🔗 Webhook endpoints available at: http://localhost:3000/webhook/*"
echo "🩺 Health check: http://localhost:3000/health"
echo ""

pnpm dev