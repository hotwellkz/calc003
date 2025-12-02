# Backend для AI-чата калькулятора SIP-домов

Backend сервер на Node.js/Express для интеграции OpenAI с калькулятором стоимости строительства.

## Установка

```bash
cd backend
npm install
```

## Настройка

Создайте файл `.env` в папке `backend/`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Запуск

### Режим разработки (с автоперезагрузкой)
```bash
npm run dev
```

### Production
```bash
npm start
```

Сервер будет доступен по адресу `http://localhost:3001`

## API Endpoints

### POST /api/ai/calculator-chat

Отправляет сообщения в AI-чат и получает ответы.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Хочу одноэтажный дом 80 м² в Алматы"
    }
  ]
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "Отлично! Я рассчитал стоимость вашего дома..."
}
```

## Структура проекта

```
backend/
├── server.js              # Основной файл сервера
├── routes/
│   └── aiCalculator.js   # Роут для AI-чата
├── services/
│   └── sipCalculator.js  # Логика расчёта стоимости
├── data/
│   ├── calculatorData.js  # Данные калькулятора
│   └── deliveryData.js   # Данные о доставке
└── config/
    └── pricing.js         # Конфигурация цен
```

## Важно

- Все расчёты выполняются на backend с использованием той же логики, что и на frontend
- AI использует функцию `calculate_sip_house_cost` для получения точных расчётов
- Модель OpenAI не придумывает цены сама, а всегда вызывает функцию расчёта

