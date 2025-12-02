import { CalculatorInput, CalculationResult } from '../types/calculator';
import { calculatePrice } from '../utils/calculatePrice';

/**
 * Параметры для расчёта стоимости SIP-дома
 * Упрощённый интерфейс для использования в AI-чате
 */
export interface SipCalcParams {
  area: number;
  floors: number | string; // Может быть числом (1, 2, 3) или строкой ('1 этаж', '2 этажа', '3 этажа')
  foundationType: string;
  wallType?: string; // Не используется напрямую, но может быть полезен для AI
  roofType: string;
  firstFloorHeight: number;
  secondFloorHeight?: number;
  thirdFloorHeight?: number;
  firstFloorThickness?: number;
  secondFloorThickness?: number;
  thirdFloorThickness?: number;
  firstFloorType?: string;
  secondFloorType?: string;
  thirdFloorType?: string;
  partitionType?: string;
  ceiling?: string;
  houseShape?: string;
  additionalWorks?: string;
  useCustomWorks?: boolean;
  customWorks?: Array<{ name: string; price: number | string }>;
  city?: string; // Город доставки
  hasVat?: boolean; // НДС (применяется на frontend)
  hasInstallment?: boolean; // Рассрочка (применяется на frontend)
}

/**
 * Результат расчёта стоимости SIP-дома
 */
export interface SipCalcResult {
  total: number;
  pricePerM2: number;
  foundation: number;
  houseKit: number;
  assembly: number;
  deliveryCost?: number;
}

/**
 * Преобразует floors из числа или строки в строку формата "N этаж/этажа/этажей"
 */
function normalizeFloors(floors: number | string): string {
  if (typeof floors === 'number') {
    if (floors === 1) return '1 этаж';
    if (floors === 2) return '2 этажа';
    if (floors === 3) return '3 этажа';
    return `${floors} этажа`;
  }
  return floors;
}

/**
 * Преобразует высоту этажа из числа в строку формата "X,X м"
 */
function normalizeFloorHeight(height: number): string {
  return `${height} м`;
}

/**
 * Преобразует толщину стены из числа в строку формата "SIP-XXX мм"
 */
function normalizeWallThickness(thickness: number): string {
  return `SIP-${thickness} мм`;
}

/**
 * Основная функция расчёта стоимости SIP-дома
 * Использует существующую логику calculatePrice из utils/calculatePrice.ts
 * 
 * @param params - Параметры дома для расчёта
 * @returns Результат расчёта с разбивкой по статьям
 */
export function calculateSipCost(params: SipCalcParams): SipCalcResult {
  // Преобразуем параметры в формат CalculatorInput
  const calculatorInput: CalculatorInput = {
    area: params.area,
    foundation: params.foundationType,
    floors: normalizeFloors(params.floors),
    firstFloorType: params.firstFloorType || 'Полноценный',
    secondFloorType: params.secondFloorType || 'Полноценный',
    thirdFloorType: params.thirdFloorType || 'Полноценный',
    firstFloorHeight: params.firstFloorHeight,
    secondFloorHeight: params.secondFloorHeight,
    thirdFloorHeight: params.thirdFloorHeight,
    firstFloorThickness: params.firstFloorThickness || 163,
    secondFloorThickness: params.secondFloorThickness || 163,
    thirdFloorThickness: params.thirdFloorThickness || 163,
    partitionType: params.partitionType || 'Профиль + гипсокартон + мин. вата, толщина 100 мм',
    ceiling: params.ceiling || 'Потолок утеплённый (пенополистирол 145 мм)',
    roofType: params.roofType,
    houseShape: params.houseShape || 'Простая форма',
    additionalWorks: params.additionalWorks || 'Без дополнительных работ',
    useCustomWorks: params.useCustomWorks || false,
    customWorks: params.customWorks || [],
    deliveryCity: params.city,
  };

  // Вызываем существующую функцию расчёта
  const result: CalculationResult = calculatePrice(calculatorInput);

  // Преобразуем результат в формат SipCalcResult
  return {
    total: result.total,
    pricePerM2: result.pricePerSqm,
    foundation: result.fundamentCost,
    houseKit: result.kitCost,
    assembly: result.assemblyCost,
    deliveryCost: result.deliveryCost,
  };
}

