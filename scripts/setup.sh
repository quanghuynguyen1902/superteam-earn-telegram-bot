#!/bin/bash

# Superteam Earn Telegram Bot Setup Script

echo "🚀 Setting up Superteam Earn Telegram Bot..."

# Check if required tools are installed
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "📦 Checking dependencies..."
check_dependency "node"
check_dependency "pnpm"
check_dependency "docker"

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration:"
    echo "   - TELEGRAM_BOT_TOKEN (get from @BotFather)"
    echo "   - Database credentials"
    echo "   - EARN_DATABASE_URL"
    echo "   - WEBHOOK_SECRET"
    read -p "Press enter when you've configured your .env file..."
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Generate Prisma clients
echo "🗄️ Generating Prisma clients..."
pnpm db:generate
pnpm bot-db:generate

# Set up databases
echo "🗄️ Setting up databases..."
pnpm prisma db push --force-reset
pnpm prisma db push --schema=prisma/bot-schema.prisma

# Seed databases
echo "🌱 Seeding databases..."
pnpm db:seed
pnpm bot-db:seed

# Build the application
echo "🔨 Building application..."
pnpm build

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Configure your TELEGRAM_BOT_TOKEN in .env"
echo "2. Start the bot: pnpm dev"
echo "3. Access databases:"
echo "   • Earn DB (MySQL): pnpm db:studio"
echo "   • Bot DB (PostgreSQL): pnpm bot-db:studio"
echo ""
echo "📚 For production deployment:"
echo "• Docker: docker build -t earn-bot ."
echo "• Vercel: vercel --prod"
echo "• Railway: Push to connected repository"
echo ""
echo "🔗 Integration with Earn platform:"
echo "• See EARN_INTEGRATION.md for required changes"
echo "• Add bot link to user menu"
echo "• Set up webhook endpoints (optional)"