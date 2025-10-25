#!/bin/bash

# 🧪 Тестовый скрипт для проверки аутентификации на Railway
# Запуск: chmod +x test-railway-auth.sh && ./test-railway-auth.sh

echo "🚀 Тестирование аутентификации Photo to 3D на Railway"
echo "=================================================="

BASE_URL="https://photo23d-production.up.railway.app/api"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для красивого вывода
print_status() {
    echo -e "${BLUE}[$1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Тест 1: Проверка статуса API
print_status "1/6" "Проверка статуса API..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL")
http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')

if [ "$http_code" = "200" ]; then
    print_success "API отвечает корректно"
else
    print_error "API не отвечает (HTTP $http_code)"
    exit 1
fi

# Тест 2: Попытка регистрации
print_status "2/6" "Тест регистрации..."
test_email="test-$(date +%s)@example.com"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$test_email\", \"password\": \"password123\"}")
http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')

if [ "$http_code" = "200" ] && echo "$body" | grep -q '"success":true'; then
    print_success "Регистрация работает"
else
    print_error "Регистрация не работает"
    echo "Ответ: $body"
fi

# Тест 3: Попытка входа без подтверждения email
print_status "3/6" "Тест входа без подтверждения..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$test_email\", \"password\": \"password123\"}")
http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')

if [ "$http_code" = "401" ] && echo "$body" | grep -q "Email не подтвержден"; then
    print_success "Валидация email работает"
else
    print_warning "Проверка email не работает корректно"
fi

# Тест 4: Попытка генерации без авторизации
print_status "4/6" "Тест защиты API генерации..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/generation/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/dev/null")
http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code" = "401" ]; then
    print_success "API генерации защищено"
else
    print_error "API генерации не защищено (HTTP $http_code)"
fi

# Тест 5: Попытка получения моделей без авторизации
print_status "5/6" "Тест защиты API моделей..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/models")
http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code" = "401" ]; then
    print_success "API моделей защищено"
else
    print_error "API моделей не защищено (HTTP $http_code)"
fi

# Тест 6: Проверка frontend
print_status "6/6" "Проверка frontend..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "https://photo23d-production.up.railway.app/register")
http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code" = "200" ] && echo "$response" | grep -q "Photo to 3D"; then
    print_success "Frontend доступен"
else
    print_error "Frontend не доступен (HTTP $http_code)"
fi

echo ""
echo "=================================================="
echo -e "${BLUE}📋 Резюме тестирования:${NC}"
echo ""
echo "🎯 Для полного тестирования настройте email переменные:"
echo "   EMAIL_USER=your-gmail@gmail.com"
echo "   EMAIL_APP_PASSWORD=your-16-digit-app-password"
echo "   JWT_SECRET=your-super-secret-jwt-key"
echo ""
echo "📧 После настройки протестируйте полный цикл:"
echo "   1. Регистрация → Email → Подтверждение → Вход"
echo "   2. Генерация 3D модели (спишется 1 кредит)"
echo "   3. Просмотр личных моделей"
echo ""
echo -e "${GREEN}🚀 Готово к использованию!${NC}"
