#!/bin/bash

echo "🎫 Support Ticket System - Setup Script"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your LLM API key before continuing."
    echo ""
    read -p "Press Enter when you've added your API key to .env..."
fi

# Validate .env has an API key
if grep -q "your-api-key-here" .env; then
    echo ""
    echo "⚠️  WARNING: You still have the placeholder API key in .env"
    echo "The application will run but LLM classification will use defaults."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please update your .env file and run this script again."
        exit 1
    fi
fi

echo ""
echo "🚀 Starting the application with Docker Compose..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose up --build

echo ""
echo "👋 Application stopped. Run 'docker-compose up' to start again."
