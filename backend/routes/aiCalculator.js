import { Router } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { calculateSipCost } from '../services/sipCalculator.js';

// Загружаем .env здесь, чтобы переменные были доступны до инициализации OpenAI
dotenv.config();

const router = Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Системный промпт для AI-ассистента
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `Ты — дружелюбный инженер-консультант по строительству домов из SIP-панелей компании HotWell.kz.

Твоя задача: помочь клиенту подобрать дом и рассчитать стоимость.

РЕЖИМ РАБОТЫ:
- Ты работаешь ТОЛЬКО в рамках Обычного режима калькулятора.
- Используемые параметры: площадь застройки, количество этажей, тип первого этажа (по умолчанию «Полноценный»), высота первого этажа (по умолчанию 2.5 м), тип крыши, форма дома, дополнительные работы, флаги НДС/рассрочки, город строительства.
- Параметры профессионального режима (толщина стен, перегородки, тип потолка и т.п.) клиенту НЕ показывай и НЕ спрашивай — они выбираются калькулятором автоматически по умолчанию.

ДИАЛОГ:
- В начале коротко поприветствуй и попроси описать дом свободным текстом: примерно площадь, количество этажей и город.
- Из каждого ответа пользователя постарайся вытащить максимально возможное количество параметров.
- Если каких-то параметров ещё не хватает — задавай СТРОГО ОДИН следующий вопрос, НЕ список.
- Приоритет недостающих вопросов: 1) площадь, 2) этажность, 3) город, 4) тип крыши, 5) форма дома, 6) дополнительные работы, 7) НДС/рассрочка (если явно не указаны).
- Город строительства — обязательный параметр. Если он не указан, обязательно спроси отдельным вопросом: в каком городе планируется строительство и поясни, что это важно для логистики и условий.
- Как только всех параметров достаточно для расчёта, немедленно вызывай функцию calculate_sip_house_cost и больше вопросов не задавай, пока пользователь сам не захочет изменить параметры.

ЧИСЛА И РАСЧЁТЫ (КРИТИЧЕСКИ ВАЖНО - ИСПОЛНЯЙ СТРОГО):
- ВСЕ цифры (стоимость фундамента, домокомплекта, сборки, доставки, итоговая цена, цена за м²) ты ОБЯЗАН использовать СТРОГО из переданного объекта результата (tool result).
- В tool result есть поля total, pricePerM2, foundation, houseKit, assembly, deliveryCost — это уже отформатированные числа с пробелами.
- НЕЛЬЗЯ ничего пересчитывать, изменять, округлять, делить или умножать.
- НЕЛЬЗЯ придумывать числа сам, НЕЛЬЗЯ оценивать «примерно».
- НЕЛЬЗЯ пересчитывать total из pricePerM2 * area — используй готовое значение total из результата.
- Просто используй готовые отформатированные значения из полей total, pricePerM2, foundation, houseKit, assembly, deliveryCost.
- Если в tool result есть поле _instruction — следуй ему строго.
- Пример: если в результате total = "9 091 170", то в тексте напиши именно "9 091 170 ₸", без изменений.`
};

/**
 * POST /api/ai/calculator-chat
 * Endpoint для общения с AI-ассистентом калькулятора
 */
router.post('/ai/calculator-chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'INVALID_REQUEST',
        message: 'Поле messages должно быть массивом'
      });
    }

    // Добавляем системное сообщение в начало, если его нет
    const messagesWithSystem = messages.some(m => m.role === 'system')
      ? messages
      : [SYSTEM_MESSAGE, ...messages];

    // Первый запрос к OpenAI с tool calling
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messagesWithSystem,
      tools: [
        {
          type: 'function',
          function: {
            name: 'calculate_sip_house_cost',
            description: 'Точный расчёт стоимости дома из SIP-панелей по параметрам Обычного режима. Используй только простые параметры (площадь, этажи, тип первого этажа, высота, тип крыши, форма дома, доп. работы, город, НДС/рассрочка).',
            parameters: {
              type: 'object',
              properties: {
                area: {
                  type: 'number',
                  description: 'Площадь застройки в квадратных метрах (от 10 до 1500 м²)'
                },
                floors: {
                  type: 'integer',
                  description: 'Количество этажей: 1, 2 или 3'
                },
                firstFloorType: {
                  type: 'string',
                  description: 'Тип первого этажа: "Полноценный" (по умолчанию) или "Мансардный", если клиент явно просит мансарду'
                },
                roofType: {
                  type: 'string',
                  description: 'Тип крыши. Примеры: "1-скатная", "2-скатная (строп. сист. + металлочерепица)", "4-скатная (конверт, для одно- или двухэтажного дома)"'
                },
                firstFloorHeight: {
                  type: 'number',
                  description: 'Высота первого этажа в метрах (по умолчанию 2.5, если клиент не указал иного)'
                },
                houseShape: {
                  type: 'string',
                  description: 'Форма дома: "Простая форма" или "Сложная форма"'
                },
                additionalWorks: {
                  type: 'string',
                  description: 'Дополнительные работы. Примеры: "Без дополнительных работ", "Обшивка СИП стен внутри дома гипсокартоном"'
                },
                city: {
                  type: 'string',
                  description: 'Город доставки. Примеры: "Алматы", "Астана", "Шымкент", "Караганда" и т.д.'
                },
                hasVat: {
                  type: 'boolean',
                  description: 'Нужно ли отображать цены с НДС (+16%). Если явно не указано, можно не спрашивать и использовать значение по умолчанию.'
                },
                hasInstallment: {
                  type: 'boolean',
                  description: 'Нужна ли рассрочка (+17%). Если явно не указано, можно не спрашивать и использовать значение по умолчанию.'
                }
              },
              required: ['area', 'floors', 'roofType', 'firstFloorHeight', 'city']
            }
          }
        }
      ],
      tool_choice: 'auto',
      temperature: 0.3
    });

    const assistantMessage = response.choices[0].message;

    // Если модель решила вызвать функцию
    const toolCall = assistantMessage.tool_calls?.[0];

    if (toolCall && toolCall.function.name === 'calculate_sip_house_cost') {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        
        // Нормализуем параметры для обычного режима (дефолтные значения)
        const normalizedArgs = {
          ...args,
          // Если не указаны, используем дефолты как в обычном режиме формы
          firstFloorType: args.firstFloorType || 'Полноценный',
          firstFloorHeight: args.firstFloorHeight || 2.5,
          secondFloorHeight: args.secondFloorHeight || (args.floors >= 2 ? 2.5 : undefined),
          thirdFloorHeight: args.thirdFloorHeight || (args.floors === 3 ? 2.5 : undefined),
          firstFloorThickness: args.firstFloorThickness || 163,
          secondFloorThickness: args.secondFloorThickness || (args.floors >= 2 ? 163 : undefined),
          thirdFloorThickness: args.thirdFloorThickness || (args.floors === 3 ? 163 : undefined),
          partitionType: args.partitionType || 'Профиль + гипсокартон + мин. вата, толщина 100 мм',
          ceiling: args.ceiling || 'Потолок утеплённый (пенополистирол 145 мм)',
          houseShape: args.houseShape || 'Простая форма',
          additionalWorks: args.additionalWorks || 'Без дополнительных работ',
          hasVat: args.hasVat || false,
          hasInstallment: args.hasInstallment || false,
          installmentAmount: args.installmentAmount || 0
        };
        
        // Вызываем функцию расчёта
        const result = calculateSipCost(normalizedArgs);
        
        // Логирование для отладки
        console.log('[AI_RESULT]', JSON.stringify(result, null, 2));
        
        // Форматируем числа для передачи в AI (чтобы модель видела уже отформатированные значения)
        const formattedResult = {
          total: new Intl.NumberFormat('ru-RU').format(result.total),
          pricePerM2: new Intl.NumberFormat('ru-RU').format(result.pricePerM2),
          foundation: new Intl.NumberFormat('ru-RU').format(result.foundation),
          houseKit: new Intl.NumberFormat('ru-RU').format(result.houseKit),
          assembly: new Intl.NumberFormat('ru-RU').format(result.assembly),
          deliveryCost: new Intl.NumberFormat('ru-RU').format(result.deliveryCost || 0),
          // Также передаём исходные числа для точности
          _raw: {
            total: result.total,
            pricePerM2: result.pricePerM2,
            foundation: result.foundation,
            houseKit: result.houseKit,
            assembly: result.assembly,
            deliveryCost: result.deliveryCost || 0
          }
        };

        // Второй запрос к OpenAI: отдать результат функции и получить красивый ответ для пользователя
        const followupResponse = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            ...messagesWithSystem,
            assistantMessage,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify({
                ...formattedResult,
                _instruction: 'Используй ТОЛЬКО эти числа. Не пересчитывай, не изменяй, не округляй. Форматированные значения уже готовы для отображения.'
              }, null, 2)
            }
          ],
          temperature: 0.4
        });

        return res.json(followupResponse.choices[0].message);
      } catch (calcError) {
        console.error('Ошибка при расчёте:', calcError);
        // Если ошибка в расчёте, возвращаем сообщение об ошибке
        const errorResponse = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            ...messagesWithSystem,
            assistantMessage,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify({ 
                error: 'Ошибка при расчёте стоимости. Проверьте параметры.' 
              })
            }
          ],
          temperature: 0.4
        });

        return res.json(errorResponse.choices[0].message);
      }
    }

    // Если модель решила просто ответить текстом (задаёт уточняющие вопросы)
    return res.json(assistantMessage);
  } catch (error) {
    console.error('AI Calculator Error:', error);
    
    // Обработка ошибок OpenAI
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: 'OPENAI_API_ERROR',
        message: error.message || 'Ошибка при обращении к OpenAI API'
      });
    }

    return res.status(500).json({
      error: 'AI_CALCULATOR_ERROR',
      message: error.message || 'Произошла ошибка при обработке запроса'
    });
  }
});

export default router;

