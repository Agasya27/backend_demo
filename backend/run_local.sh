#!/bin/bash

echo "🚀 Running Django Locally (Without Docker)"
echo "=========================================="
echo ""

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Install it with: brew install postgresql@15"
    echo "Or use Docker instead: docker-compose up --build"
    exit 1
fi

echo "✓ PostgreSQL found"
echo ""

# Set environment variables for local development
export POSTGRES_DB=ticketsupport
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432

# Load .env file
if [ -f "../.env" ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

echo "📦 Running migrations..."
python3 manage.py migrate

echo ""
echo "👤 Creating superuser (optional)..."
echo "Skip this if you don't need admin access"
python3 manage.py createsuperuser --noinput --username admin --email admin@example.com 2>/dev/null || true

echo ""
echo "🚀 Starting Django development server..."
echo "Backend will be available at: http://localhost:8000"
echo ""
python3 manage.py runserver
