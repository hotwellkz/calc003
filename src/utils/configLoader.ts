// Упрощенная версия configLoader без Firebase
// Использует только статические данные из calculatorData
import * as defaultConfig from './calculatorData';
import { DELIVERY_CITIES } from './deliveryData';
import { GLOBAL_PRICE_MULTIPLIER } from '../config/pricing';

let cachedConfig: any = null;

export const loadCalculatorConfig = async () => {
  // Если конфигурация уже кэширована, возвращаем её
  if (cachedConfig) {
    return cachedConfig;
  }

  // Используем только дефолтную конфигурацию
  cachedConfig = {
    BASE_PRICES: defaultConfig.BASE_PRICES,
    FOUNDATION_OPTIONS: defaultConfig.FOUNDATION_OPTIONS,
    FLOORS_OPTIONS: defaultConfig.FLOORS_OPTIONS,
    FIRST_FLOOR_TYPE_OPTIONS: defaultConfig.FIRST_FLOOR_TYPE_OPTIONS,
    SECOND_FLOOR_TYPE_OPTIONS: defaultConfig.SECOND_FLOOR_TYPE_OPTIONS,
    THIRD_FLOOR_TYPE_OPTIONS: defaultConfig.THIRD_FLOOR_TYPE_OPTIONS,
    FLOOR_HEIGHT_OPTIONS: defaultConfig.FLOOR_HEIGHT_OPTIONS,
    WALL_THICKNESS_OPTIONS: defaultConfig.WALL_THICKNESS_OPTIONS,
    PARTITION_OPTIONS: defaultConfig.PARTITION_OPTIONS,
    CEILING_OPTIONS: defaultConfig.CEILING_OPTIONS,
    ROOF_OPTIONS: defaultConfig.ROOF_OPTIONS,
    HOUSE_SHAPE_OPTIONS: defaultConfig.HOUSE_SHAPE_OPTIONS,
    ADDITIONAL_WORKS_OPTIONS: defaultConfig.ADDITIONAL_WORKS_OPTIONS,
    DELIVERY_OPTIONS: [...DELIVERY_CITIES],
    COST_BREAKDOWN: defaultConfig.COST_BREAKDOWN,
    AREA_LIMITS: defaultConfig.AREA_LIMITS,
    GLOBAL_PRICE_MULTIPLIER: GLOBAL_PRICE_MULTIPLIER
  };

  return cachedConfig;
};

// Функция для сброса кэша (для совместимости)
export const clearConfigCache = () => {
  cachedConfig = null;
};

// Синхронная функция для получения конфигурации
export const getConfigSync = () => {
  if (!cachedConfig) {
    // Инициализируем синхронно, если еще не загружено
    cachedConfig = {
      BASE_PRICES: defaultConfig.BASE_PRICES,
      FOUNDATION_OPTIONS: defaultConfig.FOUNDATION_OPTIONS,
      FLOORS_OPTIONS: defaultConfig.FLOORS_OPTIONS,
      FIRST_FLOOR_TYPE_OPTIONS: defaultConfig.FIRST_FLOOR_TYPE_OPTIONS,
      SECOND_FLOOR_TYPE_OPTIONS: defaultConfig.SECOND_FLOOR_TYPE_OPTIONS,
      THIRD_FLOOR_TYPE_OPTIONS: defaultConfig.THIRD_FLOOR_TYPE_OPTIONS,
      FLOOR_HEIGHT_OPTIONS: defaultConfig.FLOOR_HEIGHT_OPTIONS,
      WALL_THICKNESS_OPTIONS: defaultConfig.WALL_THICKNESS_OPTIONS,
      PARTITION_OPTIONS: defaultConfig.PARTITION_OPTIONS,
      CEILING_OPTIONS: defaultConfig.CEILING_OPTIONS,
      ROOF_OPTIONS: defaultConfig.ROOF_OPTIONS,
      HOUSE_SHAPE_OPTIONS: defaultConfig.HOUSE_SHAPE_OPTIONS,
      ADDITIONAL_WORKS_OPTIONS: defaultConfig.ADDITIONAL_WORKS_OPTIONS,
      DELIVERY_OPTIONS: [...DELIVERY_CITIES],
      COST_BREAKDOWN: defaultConfig.COST_BREAKDOWN,
      AREA_LIMITS: defaultConfig.AREA_LIMITS,
      GLOBAL_PRICE_MULTIPLIER: GLOBAL_PRICE_MULTIPLIER
    };
  }
  return cachedConfig;
};

