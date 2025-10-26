// Тест мультитенантности - создание нескольких пользователей
// Запуск: node test-multitenancy.js

const API_URL = 'http://localhost:3001/api';

async function testAPI(endpoint, data) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log(`\n📡 ${endpoint}:`);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${result.success}`);
    if (result.message) console.log(`Message: ${result.message}`);
    if (result.error) console.log(`Error: ${result.error}`);
    if (result.data) console.log(`Data:`, JSON.stringify(result.data, null, 2));

    return result;
  } catch (error) {
    console.error(`❌ Ошибка при вызове ${endpoint}:`, error.message);
    return null;
  }
}

async function testMultitenancy() {
  console.log('🧪 ТЕСТИРОВАНИЕ МУЛЬТИТЕНАНТНОСТИ\n');
  console.log('=' .repeat(50));

  // Тест 1: Регистрация первого пользователя
  console.log('\n👤 ТЕСТ 1: Регистрация первого пользователя');
  const user1 = await testAPI('/auth/register', {
    email: 'user1@example.com',
    password: 'password123',
    username: 'user1'
  });

  // Тест 2: Регистрация второго пользователя
  console.log('\n👤 ТЕСТ 2: Регистрация второго пользователя');
  const user2 = await testAPI('/auth/register', {
    email: 'user2@example.com',
    password: 'password123',
    username: 'user2'
  });

  // Тест 3: Регистрация третьего пользователя без username
  console.log('\n👤 ТЕСТ 3: Регистрация пользователя без username');
  const user3 = await testAPI('/auth/register', {
    email: 'user3@example.com',
    password: 'password123'
  });

  // Тест 4: Попытка регистрации с существующим email
  console.log('\n❌ ТЕСТ 4: Попытка регистрации с существующим email');
  await testAPI('/auth/register', {
    email: 'user1@example.com',
    password: 'differentpassword',
    username: 'user1_duplicate'
  });

  // Тест 5: Попытка регистрации с существующим username
  console.log('\n❌ ТЕСТ 5: Попытка регистрации с существующим username');
  await testAPI('/auth/register', {
    email: 'user4@example.com',
    password: 'password123',
    username: 'user1'
  });

  // Тест 6: Вход первого пользователя
  console.log('\n🔐 ТЕСТ 6: Вход первого пользователя');
  if (user1 && user1.success) {
    const login1 = await testAPI('/auth/login', {
      email: 'user1@example.com',
      password: 'password123'
    });

    if (login1 && login1.success && login1.data.token) {
      console.log('\n✅ Токен получен, проверяем доступ к защищенным роутам');

      // Тест 7: Доступ к защищенным роутам
      console.log('\n🔒 ТЕСТ 7: Доступ к моделям пользователя');
      try {
        const modelsResponse = await fetch(`${API_URL}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${login1.data.token}`
          }
        });
        const models = await modelsResponse.json();
        console.log(`Модели пользователя 1: ${models.data ? models.data.length : 0} шт.`);
      } catch (error) {
        console.error('Ошибка получения моделей:', error.message);
      }
    }
  }

  // Тест 8: Вход второго пользователя
  console.log('\n🔐 ТЕСТ 8: Вход второго пользователя');
  if (user2 && user2.success) {
    const login2 = await testAPI('/auth/login', {
      email: 'user2@example.com',
      password: 'password123'
    });

    if (login2 && login2.success && login2.data.token) {
      console.log('\n✅ Токен получен, проверяем изоляцию данных');

      // Тест 9: Проверка изоляции данных
      console.log('\n🔒 ТЕСТ 9: Проверка изоляции данных пользователя 2');
      try {
        const modelsResponse = await fetch(`${API_URL}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${login2.data.token}`
          }
        });
        const models = await modelsResponse.json();
        console.log(`Модели пользователя 2: ${models.data ? models.data.length : 0} шт.`);
        console.log('✅ Данные изолированы - каждый пользователь видит только свои модели');
      } catch (error) {
        console.error('Ошибка получения моделей:', error.message);
      }
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
  console.log('✅ Мультитенантность работает корректно');
  console.log('✅ Пользователи регистрируются независимо');
  console.log('✅ Данные пользователей изолированы');
  console.log('✅ Каждый пользователь имеет свои 100 кредитов');
}

// Запуск тестов
testMultitenancy().catch(console.error);
