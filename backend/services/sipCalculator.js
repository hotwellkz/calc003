// Копия логики расчёта для использования в backend
// Использует те же формулы, что и frontend

import * as calculatorData from '../data/calculatorData.js';
import { DELIVERY_CITIES, calculateTrucksNeeded } from '../data/deliveryData.js';
import { GLOBAL_PRICE_MULTIPLIER } from '../config/pricing.js';

// Получить базовую цену за квадратный метр
const getBasePricePerSqm = (area) => {
  const priceRange = calculatorData.BASE_PRICES.find(
    (range) => area >= range.min && area <= range.max
  );
  return priceRange ? priceRange.price : 0;
};

// Получить доплату за фундамент
const getFoundationAddition = (foundation) => {
  const option = calculatorData.FOUNDATION_OPTIONS.find(
    (opt) => opt.label === foundation
  );
  return option ? (option.value || option.addition || 0) : 0;
};

// Получить доплату за этажность
const getFloorsAddition = (floors) => {
  const option = calculatorData.FLOORS_OPTIONS.find(
    (opt) => opt.label === floors
  );
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за тип первого этажа
const getFirstFloorTypeAddition = (firstFloorType, floors) => {
  if (floors !== '1 этаж') return 0;
  const option = calculatorData.FIRST_FLOOR_TYPE_OPTIONS.find(
    (opt) => opt.label === firstFloorType
  );
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за тип второго этажа
const getSecondFloorTypeAddition = (secondFloorType, floors) => {
  if (floors !== '2 этажа' && floors !== '3 этажа') return 0;
  const effectiveSecondFloorType = floors === '3 этажа' ? 'Полноценный' : secondFloorType;
  const option = calculatorData.SECOND_FLOOR_TYPE_OPTIONS.find(
    (opt) => opt.label === effectiveSecondFloorType
  );
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за тип третьего этажа
const getThirdFloorTypeAddition = (thirdFloorType, floors) => {
  if (floors !== '3 этажа') return 0;
  const option = calculatorData.THIRD_FLOOR_TYPE_OPTIONS.find(
    (opt) => opt.label === thirdFloorType
  );
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за высоту этажа
const getFloorHeightAddition = (height) => {
  const option = calculatorData.FLOOR_HEIGHT_OPTIONS.find(
    (opt) => opt.value === height
  );
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за толщину стен
const getWallThicknessAddition = (thickness) => {
  const option = calculatorData.WALL_THICKNESS_OPTIONS.find(
    (opt) => opt.value === thickness
  );
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за перегородки на основе высоты
const getPartitionAddition = (partitionType, height) => {
  let partitionGroup;
  if (height === 2.5) partitionGroup = calculatorData.PARTITION_OPTIONS.height_2_5;
  else if (height === 2.8) partitionGroup = calculatorData.PARTITION_OPTIONS.height_2_8;
  else if (height === 2.9) partitionGroup = calculatorData.PARTITION_OPTIONS.height_2_9;
  else if (height === 3.0) partitionGroup = calculatorData.PARTITION_OPTIONS.height_3_0;
  else if (height === 3.5) partitionGroup = calculatorData.PARTITION_OPTIONS.height_3_5;
  else if (height === 4.0) partitionGroup = calculatorData.PARTITION_OPTIONS.height_4_0;
  else partitionGroup = calculatorData.PARTITION_OPTIONS.height_2_5;
  
  const option = partitionGroup.find((opt) => opt.label === partitionType);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за потолок
const getCeilingAddition = (ceiling) => {
  const option = calculatorData.CEILING_OPTIONS.find(
    (opt) => opt.label === ceiling
  );
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за крышу
const getRoofAddition = (roofType, floors) => {
  const option = calculatorData.ROOF_OPTIONS.find((opt) => {
    if (opt.floors && opt.floors !== floors.charAt(0)) return false;
    return opt.label === roofType;
  });
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за форму дома
const getHouseShapeAddition = (houseShape) => {
  const option = calculatorData.HOUSE_SHAPE_OPTIONS.find(
    (opt) => opt.label === houseShape
  );
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за дополнительные работы
const getAdditionalWorksAddition = (
  additionalWorks,
  useCustomWorks = false,
  customWorks = []
) => {
  if (useCustomWorks) {
    return customWorks.reduce((sum, work) => {
      const price = typeof work.price === 'string'
        ? Number(work.price.replace(/\s/g, ''))
        : Number(work.price);
      return sum + (price || 0);
    }, 0);
  }
  
  const option = calculatorData.ADDITIONAL_WORKS_OPTIONS.find(
    (opt) => opt.label === additionalWorks
  );
  return option ? (option.addition || 0) : 0;
};

// Получить стоимость доставки
const getDeliveryCost = (totalArea, deliveryCity) => {
  const cityOption = DELIVERY_CITIES.find((city) => city.label === deliveryCity);
  
  if (!cityOption || cityOption.price === 0 || !deliveryCity || deliveryCity === 'Выберите город доставки') {
    return 0;
  }
  
  const trucksNeeded = calculateTrucksNeeded(totalArea);
  return trucksNeeded * cityOption.price;
};

// Преобразует floors из числа или строки в строку формата "N этаж/этажа/этажей"
function normalizeFloors(floors) {
  if (typeof floors === 'number') {
    if (floors === 1) return '1 этаж';
    if (floors === 2) return '2 этажа';
    if (floors === 3) return '3 этажа';
    return `${floors} этажа`;
  }
  return floors;
}

/**
 * Основная функция расчёта стоимости SIP-дома
 * Использует ту же логику, что и frontend
 */
export function calculateSipCost(params) {
  const { area } = params;
  
  // Проверка ограничений площади
  if (area < calculatorData.AREA_LIMITS.min || area > calculatorData.AREA_LIMITS.max) {
    return {
      total: 0,
      pricePerM2: 0,
      foundation: 0,
      houseKit: 0,
      assembly: 0,
      deliveryCost: 0
    };
  }

  const floors = normalizeFloors(params.floors);
  // Если тип фундамента не указан (обычный режим), используем значение по умолчанию как в форме
  const effectiveFoundationType =
    params.foundationType || (calculatorData.FOUNDATION_OPTIONS[0]?.label ?? '');
  
  // Расчет компонентов стоимости
  const basePrice = getBasePricePerSqm(area);
  const foundationAddition = getFoundationAddition(effectiveFoundationType);
  const floorsAddition = getFloorsAddition(floors);
  const firstFloorTypeAddition = getFirstFloorTypeAddition(
    params.firstFloorType || 'Полноценный',
    floors
  );
  const secondFloorTypeAddition = getSecondFloorTypeAddition(
    params.secondFloorType || 'Полноценный',
    floors
  );
  const thirdFloorTypeAddition = getThirdFloorTypeAddition(
    params.thirdFloorType || 'Полноценный',
    floors
  );
  const firstFloorHeightAddition = getFloorHeightAddition(params.firstFloorHeight);
  const secondFloorHeightAddition = params.secondFloorHeight
    ? getFloorHeightAddition(params.secondFloorHeight)
    : 0;
  const thirdFloorHeightAddition = params.thirdFloorHeight
    ? getFloorHeightAddition(params.thirdFloorHeight)
    : 0;
  const firstFloorThicknessAddition = getWallThicknessAddition(
    params.firstFloorThickness || 163
  );
  const secondFloorThicknessAddition = params.secondFloorThickness
    ? getWallThicknessAddition(params.secondFloorThickness)
    : 0;
  const thirdFloorThicknessAddition = params.thirdFloorThickness
    ? getWallThicknessAddition(params.thirdFloorThickness)
    : 0;
  const partitionAddition = getPartitionAddition(
    params.partitionType || 'Профиль + гипсокартон + мин. вата, толщина 100 мм',
    params.firstFloorHeight
  );
  const ceilingAddition = getCeilingAddition(
    params.ceiling || 'Потолок утеплённый (пенополистирол 145 мм)'
  );
  const roofAddition = getRoofAddition(params.roofType, floors);
  const houseShapeAddition = getHouseShapeAddition(
    params.houseShape || 'Простая форма'
  );

  // Формула итогового расчёта
  const pricePerSqm =
    basePrice +
    floorsAddition +
    firstFloorHeightAddition +
    secondFloorHeightAddition +
    thirdFloorHeightAddition +
    firstFloorThicknessAddition +
    secondFloorThicknessAddition +
    thirdFloorThicknessAddition +
    firstFloorTypeAddition +
    secondFloorTypeAddition +
    thirdFloorTypeAddition +
    foundationAddition +
    roofAddition +
    houseShapeAddition +
    partitionAddition +
    ceilingAddition;

  // Для кастомных работ добавляем их стоимость отдельно
  const customWorksTotal = params.useCustomWorks
    ? getAdditionalWorksAddition(
        params.additionalWorks,
        params.useCustomWorks,
        params.customWorks || []
      )
    : 0;

  const baseTotalCost = Math.round(pricePerSqm * area);
  const standardAdditionalWorksTotal = !params.useCustomWorks
    ? Math.round(
        getAdditionalWorksAddition(
          params.additionalWorks || 'Без дополнительных работ'
        ) * area
      )
    : 0;

  // Расчет стоимости доставки
  const deliveryCost = params.city
    ? getDeliveryCost(area, params.city)
    : 0;

  const total = baseTotalCost + standardAdditionalWorksTotal + customWorksTotal + deliveryCost;

  // Разбивка итоговой стоимости
  const costWithoutDelivery = baseTotalCost + standardAdditionalWorksTotal + customWorksTotal;
  const fundamentCost = Math.round(
    costWithoutDelivery * calculatorData.COST_BREAKDOWN.foundation
  );
  const kitCost = Math.round(
    costWithoutDelivery * calculatorData.COST_BREAKDOWN.houseKit
  );
  const assemblyCost = Math.round(
    costWithoutDelivery * calculatorData.COST_BREAKDOWN.assembly
  );

  // Применяем глобальный коэффициент наценки
  const priceMultiplier = GLOBAL_PRICE_MULTIPLIER || 1.0;

  return {
    total: Math.round(total * priceMultiplier),
    pricePerM2: Math.round(pricePerSqm * priceMultiplier),
    foundation: Math.round(fundamentCost * priceMultiplier),
    houseKit: Math.round(kitCost * priceMultiplier),
    assembly: Math.round(assemblyCost * priceMultiplier),
    deliveryCost: Math.round(deliveryCost * priceMultiplier)
  };
}

