#!/bin/bash

echo "🔍 Support Ticket System - Code Validation"
echo "==========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

echo "1. Checking Python syntax..."
if find backend -name "*.py" -exec python3 -m py_compile {} \; 2>&1 | grep -q "SyntaxError"; then
    echo -e "${RED}✗ Python syntax errors found${NC}"
    ((errors++))
else
    echo -e "${GREEN}✓ All Python files have valid syntax${NC}"
fi

echo ""
echo "2. Checking required files..."
required_files=(
    "docker-compose.yml"
    ".env"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "backend/manage.py"
    "backend/config/settings.py"
    "backend/tickets/models.py"
    "backend/tickets/views.py"
    "backend/tickets/serializers.py"
    "backend/tickets/llm_service.py"
    "frontend/Dockerfile"
    "frontend/package.json"
    "frontend/src/App.js"
    "frontend/src/components/TicketForm.js"
    "frontend/src/components/TicketList.js"
    "frontend/src/components/TicketItem.js"
    "frontend/src/components/StatsPanel.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        ((errors++))
    fi
done

echo ""
echo "3. Checking .env configuration..."
if grep -q "your-api-key-here" .env; then
    echo -e "${YELLOW}⚠ Warning: .env still has placeholder API key${NC}"
    echo "  Update LLM_API_KEY in .env before running"
    ((warnings++))
else
    echo -e "${GREEN}✓ .env has been configured${NC}"
fi

echo ""
echo "4. Checking requirements.txt..."
required_packages=(
    "Django"
    "djangorestframework"
    "psycopg2-binary"
    "django-cors-headers"
    "python-dotenv"
    "dj-database-url"
    "openai"
    "anthropic"
    "google-generativeai"
)

for package in "${required_packages[@]}"; do
    if grep -q "$package" backend/requirements.txt; then
        echo -e "${GREEN}✓${NC} $package"
    else
        echo -e "${RED}✗${NC} $package (missing)"
        ((errors++))
    fi
done

echo ""
echo "5. Checking package.json..."
if [ -f "frontend/package.json" ]; then
    if grep -q "react" frontend/package.json && grep -q "axios" frontend/package.json; then
        echo -e "${GREEN}✓ Frontend dependencies configured${NC}"
    else
        echo -e "${RED}✗ Missing frontend dependencies${NC}"
        ((errors++))
    fi
fi

echo ""
echo "=========================================="
echo "Summary:"
echo -e "Errors: ${RED}$errors${NC}"
echo -e "Warnings: ${YELLOW}$warnings${NC}"
echo ""

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to run:${NC}"
    echo "  docker-compose up --build"
else
    echo -e "${RED}✗ Please fix the errors above before running${NC}"
    exit 1
fi
