import React, { useState, useEffect, useRef } from 'react';
import { Copy, FileText, Palette, ChevronDown } from 'lucide-react';
import { CalculationResult } from '../../types/calculator';
import { calculateTrucksNeeded } from '../../utils/deliveryData';

// Декларация типов для html2pdf.js
declare const html2pdf: any;

interface CommercialProposalProps {
  area: number;
  parameters: {
    foundation: string;
    floors: string;
    firstFloorType?: string;
    secondFloorType?: string;
    thirdFloorType?: string;
    firstFloorHeight: string;
    secondFloorHeight?: string;
    thirdFloorHeight?: string;
    firstFloorThickness: string;
    secondFloorThickness?: string;
    thirdFloorThickness?: string;
    partitionType: string;
    ceiling: string;
    roofType: string;
    houseShape: string;
    additionalWorks: string;
    useCustomWorks: boolean;
    customWorks: Array<{ name: string; price: number | string }>;
    deliveryCity?: string;
  };
  result: CalculationResult;
  options: {
    isVatIncluded: boolean;
    isInstallment: boolean;
    installmentAmount: number;
    hideFundamentCost?: boolean;
    hideKitCost?: boolean;
    hideAssemblyCost?: boolean;
    hideDeliveryCost?: boolean;
  };
}

type ThemeType = 'light' | 'dark' | 'classic' | 'mobile';

export const CommercialProposal: React.FC<CommercialProposalProps> = ({
  area,
  parameters,
  result,
  options
}) => {
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
    const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isMobileWidth = window.innerWidth <= 768;
    return isMobileUserAgent || isMobileWidth;
  };

  const [currentTheme, setCurrentTheme] = useState<ThemeType>('light');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pdfExportRef = useRef<HTMLDivElement>(null);

  const themes = [
    { id: 'light' as ThemeType, name: 'Светлая (зелёная)', description: 'Стандартная тема HotWell.kz' },
    { id: 'dark' as ThemeType, name: 'Премиум (тёмная)', description: 'Современный дизайн с неоновыми акцентами' },
    { id: 'classic' as ThemeType, name: 'Классическая', description: 'Элегантный деловой стиль' },
    { id: 'mobile' as ThemeType, name: 'Мобильная', description: 'Компактная тема для смартфонов' }
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem('commercialProposalTheme') as ThemeType;
    if (savedTheme && themes.find(theme => theme.id === savedTheme)) {
      setCurrentTheme(savedTheme);
    } else if (isMobileDevice()) {
      setCurrentTheme('mobile');
      localStorage.setItem('commercialProposalTheme', 'mobile');
    }
  }, []);

  const changeTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    localStorage.setItem('commercialProposalTheme', theme);
    setIsDropdownOpen(false);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const { 
    isVatIncluded, 
    isInstallment, 
    installmentAmount,
    hideFundamentCost = false,
    hideKitCost = false,
    hideAssemblyCost = false,
    hideDeliveryCost = false
  } = options;

  const getFloorTypeText = () => {
    if (parameters.floors === '1 этаж' && parameters.firstFloorType) {
      return `Тип этажа: ${parameters.firstFloorType}`;
    }
    
    let floorTypes = [];
    if (parameters.floors === '2 этажа' || parameters.floors === '3 этажа') {
      if (parameters.secondFloorType) {
        floorTypes.push(`2-й этаж: ${parameters.secondFloorType}`);
      }
    }
    if (parameters.floors === '3 этажа' && parameters.thirdFloorType) {
      floorTypes.push(`3-й этаж: ${parameters.thirdFloorType}`);
    }
    
    return floorTypes.length > 0 ? floorTypes.join(', ') : '';
  };

  const copyToClipboard = async () => {
    const text = `
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
Строительная компания HotWell.kz
По расчёту стоимости СИП дома в черновую отделку

ОСНОВНЫЕ ПАРАМЕТРЫ:
• Площадь застройки: ${area} м²
• Фундамент: ${parameters.foundation}
• Количество этажей: ${parameters.floors}
• ${getFloorTypeText()}
• Высота 1-го этажа: ${parameters.firstFloorHeight}, ${parameters.firstFloorThickness}
${parameters.floors === '2 этажа' || parameters.floors === '3 этажа' ? `• Высота 2-го этажа: ${parameters.secondFloorHeight}, ${parameters.secondFloorThickness}` : ''}
${parameters.floors === '3 этажа' ? `• Высота 3-го этажа: ${parameters.thirdFloorHeight}, ${parameters.thirdFloorThickness}` : ''}
• Перегородки: ${parameters.partitionType}
• Потолок: ${parameters.ceiling}
• Тип крыши: ${parameters.roofType}
• Форма дома: ${parameters.houseShape}

${(parameters.useCustomWorks && parameters.customWorks.some(work => work.name.trim() !== '')) || 
  (!parameters.useCustomWorks && parameters.additionalWorks !== 'Без дополнительных работ') ? 
  (parameters.useCustomWorks && parameters.customWorks.length > 0 ? `ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ:
${parameters.customWorks.filter(work => work.name.trim() !== '').map(work => `• ${work.name}: ${formatPrice(typeof work.price === 'string' ? Number(work.price.replace(/\s/g, '')) : work.price)} ₸`).join('\n')}` : `ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ:
• ${parameters.additionalWorks}`) : ''}

СТОИМОСТЬ:
${!hideFundamentCost ? `• Фундамент (14%): ${formatPrice(result.fundamentCost)} ₸\n` : ''}${!hideKitCost ? `• Домокомплект (71%): ${formatPrice(result.kitCost)} ₸\n` : ''}${!hideAssemblyCost ? `• Сборка (15%): ${formatPrice(result.assemblyCost)} ₸\n` : ''}${!hideDeliveryCost && parameters.deliveryCity && parameters.deliveryCity !== 'Выберите город доставки' && result.deliveryCost && result.deliveryCost > 0 ? `• Доставка (${parameters.deliveryCity}) - ${calculateTrucksNeeded(area)} фур${calculateTrucksNeeded(area) > 1 ? 'ы' : 'а'}: ${formatPrice(result.deliveryCost)} ₸\n` : ''}${isVatIncluded ? `• НДС 16%: ${formatPrice(Math.round((result.total / 1.16) * 0.16))} ₸\n` : ''}${isInstallment ? `• Рассрочка 17% (комиссия Kaspi): ${formatPrice(Math.round((installmentAmount > 0 ? installmentAmount : result.total) * 0.17))} ₸ (${installmentAmount > 0 ? `от ${formatPrice(installmentAmount)} ₸` : `от ${formatPrice(result.total)} ₸`})\n` : ''}

ИТОГО: ${formatPrice(result.total)} ₸ ${isVatIncluded ? 'с НДС' : 'без НДС'}

УСЛОВИЯ:
• Срок строительства: 30-45 дней
• Гарантия: 3 года
• Оплата: наличные / безналичные ${isInstallment ? '/ рассрочка' : ''}

HotWell.kz - Быстровозводимые дома из СИП-панелей по всей Республике Казахстан
    `;

    try {
      await navigator.clipboard.writeText(text.trim());
      alert('Коммерческое предложение скопировано в буфер обмена!');
    } catch (err) {
      console.error('Ошибка копирования:', err);
      alert('Не удалось скопировать текст');
    }
  };

  const exportToPDF = async () => {
    try {
      if (result.total === 0 || !area) {
        alert('Пожалуйста, сначала заполните калькулятор и получите расчет стоимости');
        return;
      }

      if (!pdfExportRef.current) {
        alert('Ошибка: PDF блок не найден');
        return;
      }

      const exportBtn = document.querySelector('#pdf-export-btn');
      if (exportBtn) {
        exportBtn.textContent = 'Создание PDF...';
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const html2pdf = (await import('html2pdf.js')).default;

      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('ru-RU').replace(/\./g, '-');
      const filename = `Коммерческое_предложение_HotWell_${dateStr}.pdf`;

      const pdfOptions = {
        margin: [10, 10, 15, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
      };

      if (!pdfExportRef.current) {
        throw new Error('PDF element not found');
      }

      const pdfDoc = await html2pdf()
        .set(pdfOptions)
        .from(pdfExportRef.current)
        .toPdf()
        .get('pdf');
      
      const totalPages = pdfDoc.internal.getNumberOfPages();
      pdfDoc.setPage(totalPages);
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(100, 100, 100);
      pdfDoc.text('Сформировано в системе HotWell.kz', 150, 285);
      
      await html2pdf()
        .set(pdfOptions)
        .from(pdfExportRef.current)
        .save();

      if (exportBtn) {
        exportBtn.textContent = 'Экспорт в PDF';
      }

    } catch (error) {
      console.error('Ошибка при экспорте в PDF:', error);
      alert('Ошибка при создании PDF файла. Попробуйте еще раз.');
      
      const exportBtn = document.querySelector('#pdf-export-btn');
      if (exportBtn) {
        exportBtn.textContent = 'Экспорт в PDF';
      }
    }
  };

  if (result.total === 0) {
    return null;
  }

  const getContainerClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "bg-[#121212] rounded-lg shadow-lg border border-gray-800 overflow-hidden";
      case 'classic':
        return "bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200";
      case 'mobile':
        return "bg-white rounded-md overflow-hidden shadow-sm border border-gray-300";
      default:
        return "bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden";
    }
  };

  const getHeaderClasses = () => {
    switch (currentTheme) {
      case 'dark':
        return "bg-gradient-to-r from-gray-900 to-black text-white p-6 text-center border-b border-[#00FF8C]";
      case 'classic':
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-[#333333] p-6 text-center border-b border-[#DDDDDD]";
      case 'mobile':
        return "bg-emerald-500 text-white p-3 text-center border-b border-emerald-600";
      default:
        return "bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6 text-center";
    }
  };

  return (
    <>
      <div 
        ref={pdfExportRef}
        id="commercial-proposal"
        className={`mt-12 max-w-4xl mx-auto ${getContainerClasses()}`}
      >
        <div className={`${currentTheme === 'mobile' ? 'mb-2' : 'mb-4'} flex justify-end`}>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center ${currentTheme === 'mobile' ? 'gap-1 px-2 py-1' : 'gap-2 px-4 py-2'} rounded-lg transition-all bg-white border border-gray-300 text-gray-700`}
            >
              <Palette className={`${currentTheme === 'mobile' ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {currentTheme === 'mobile' ? 'Темы' : themes.find(theme => theme.id === currentTheme)?.name}
              <ChevronDown className={`${currentTheme === 'mobile' ? 'w-3 h-3' : 'w-4 h-4'} transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className={`absolute right-0 ${currentTheme === 'mobile' ? 'mt-1 w-48' : 'mt-2 w-64'} rounded-lg shadow-lg z-50 bg-white border border-gray-200`}>
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => changeTheme(theme.id)}
                    className={`w-full text-left ${currentTheme === 'mobile' ? 'px-2 py-2' : 'px-4 py-3'} hover:bg-gray-50 transition-opacity border-b last:border-b-0 text-gray-700 ${currentTheme === theme.id ? 'font-semibold bg-emerald-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {currentTheme === theme.id && <span className="text-green-500">✓</span>}
                      <div>
                        <div className="font-medium">{theme.name}</div>
                        {currentTheme !== 'mobile' && (
                          <div className="text-xs mt-1 text-gray-500">{theme.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={getHeaderClasses()}>
          <div className="flex flex-col items-center justify-center">
            <div className={`${currentTheme === 'mobile' ? 'mb-2' : 'mb-4'}`}>
              <img 
                src="https://hotwell.kz/wp-content/uploads/2021/01/Logotip-hotwell.kz_.png" 
                alt="HotWell.kz Логотип"
                className={`${currentTheme === 'mobile' ? 'max-h-[60px]' : 'max-h-[120px]'} w-auto object-contain`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            <h2 className={`${currentTheme === 'mobile' ? 'text-sm font-medium mb-1' : 'text-xl md:text-2xl font-semibold mb-2'}`}>
              КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
            </h2>
            
            <p className={`${currentTheme === 'mobile' ? 'text-xs max-w-xs' : 'text-sm md:text-base max-w-md'}`}>
              По расчёту стоимости СИП дома в черновую отделку
            </p>
          </div>
        </div>

        <div className={`${currentTheme === 'mobile' ? 'p-2 space-y-3' : 'p-6 space-y-6'} ${currentTheme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}>
          <div>
            <h3 className={`${currentTheme === 'mobile' ? 'text-sm font-medium mb-1' : 'text-lg font-semibold mb-4'}`}>
              Основные параметры
            </h3>
            <div className={`${currentTheme === 'mobile' ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 md:grid-cols-2 gap-4'} bg-gray-50 rounded-lg p-4`}>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">Площадь застройки:</span> {area} м²</p>
                <p className="text-sm"><span className="font-medium">Фундамент:</span> {parameters.foundation}</p>
                <p className="text-sm"><span className="font-medium">Количество этажей:</span> {parameters.floors}</p>
                {getFloorTypeText() && (
                  <p className="text-sm"><span className="font-medium">{getFloorTypeText()}</span></p>
                )}
                <p className="text-sm"><span className="font-medium">Высота 1-го этажа:</span> {parameters.firstFloorHeight}, {parameters.firstFloorThickness}</p>
                {parameters.floors === '2 этажа' || parameters.floors === '3 этажа' ? (
                  <p className="text-sm"><span className="font-medium">Высота 2-го этажа:</span> {parameters.secondFloorHeight}, {parameters.secondFloorThickness}</p>
                ) : null}
                {parameters.floors === '3 этажа' ? (
                  <p className="text-sm"><span className="font-medium">Высота 3-го этажа:</span> {parameters.thirdFloorHeight}, {parameters.thirdFloorThickness}</p>
                ) : null}
              </div>
              {currentTheme !== 'mobile' && (
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Перегородки:</span> {parameters.partitionType}</p>
                  <p className="text-sm"><span className="font-medium">Потолок:</span> {parameters.ceiling}</p>
                  <p className="text-sm"><span className="font-medium">Тип крыши:</span> {parameters.roofType}</p>
                  <p className="text-sm"><span className="font-medium">Форма дома:</span> {parameters.houseShape}</p>
                </div>
              )}
            </div>
          </div>

          {(parameters.useCustomWorks && parameters.customWorks.some(work => work.name.trim() !== '')) || 
           (!parameters.useCustomWorks && parameters.additionalWorks !== 'Без дополнительных работ') ? (
            <div>
              <h3 className={`${currentTheme === 'mobile' ? 'text-sm font-medium mb-1' : 'text-lg font-semibold mb-4'}`}>
                Дополнительные работы
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {parameters.useCustomWorks && parameters.customWorks.length > 0 ? (
                  <div className="space-y-2">
                    {parameters.customWorks.filter(work => work.name.trim() !== '').map((work, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{work.name}</span>
                        <span className="text-sm font-medium">
                          {formatPrice(typeof work.price === 'string' 
                            ? Number(work.price.replace(/\s/g, '')) 
                            : work.price
                          )} ₸
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">{parameters.additionalWorks}</p>
                )}
              </div>
            </div>
          ) : null}

          <div>
            <h3 className={`${currentTheme === 'mobile' ? 'text-sm font-medium mb-1' : 'text-lg font-semibold mb-4'}`}>
              Стоимость
            </h3>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
              <div className="space-y-2 mb-4">
                {!hideFundamentCost && (
                  <div className="flex justify-between">
                    <span className="text-sm">🏗️ Фундамент (14%)</span>
                    <span className="text-sm font-medium">{formatPrice(result.fundamentCost)} ₸</span>
                  </div>
                )}
                {!hideKitCost && (
                  <div className="flex justify-between">
                    <span className="text-sm">🏠 Домокомплект (71%)</span>
                    <span className="text-sm font-medium">{formatPrice(result.kitCost)} ₸</span>
                  </div>
                )}
                {!hideAssemblyCost && (
                  <div className="flex justify-between">
                    <span className="text-sm">⚒️ Сборка (15%)</span>
                    <span className="text-sm font-medium">{formatPrice(result.assemblyCost)} ₸</span>
                  </div>
                )}
                {!hideDeliveryCost && parameters.deliveryCity && parameters.deliveryCity !== 'Выберите город доставки' && result.deliveryCost && result.deliveryCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">🚚 Доставка ({parameters.deliveryCity})</span>
                    <span className="text-sm font-medium">{formatPrice(result.deliveryCost)} ₸</span>
                  </div>
                )}
                {isVatIncluded && (
                  <div className="flex justify-between border-t pt-2 border-emerald-300">
                    <span className="text-sm">НДС 16%</span>
                    <span className="text-sm font-medium">{formatPrice(Math.round((result.total / 1.16) * 0.16))} ₸</span>
                  </div>
                )}
                {isInstallment && (
                  <div className="flex justify-between border-t pt-2 border-emerald-300">
                    <span className="text-sm">Рассрочка 17% (комиссия Kaspi)</span>
                    <span className="text-sm font-medium">{formatPrice(Math.round((installmentAmount > 0 ? installmentAmount : result.total) * 0.17))} ₸</span>
                  </div>
                )}
              </div>
              <div className="border-t pt-4 border-emerald-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">ИТОГО:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatPrice(result.total)} ₸
                  </span>
                </div>
                <p className="text-right text-sm text-gray-600">
                  {isVatIncluded ? 'с НДС' : 'без НДС'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className={`${currentTheme === 'mobile' ? 'text-sm font-medium mb-1' : 'text-lg font-semibold mb-4'}`}>
              Условия
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Срок строительства</p>
                  <p>30-45 дней</p>
                </div>
                <div>
                  <p className="font-medium">Гарантия</p>
                  <p>3 года</p>
                </div>
                <div>
                  <p className="font-medium">Оплата</p>
                  <p>наличные / безналичные{isInstallment ? ' / рассрочка' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${currentTheme === 'mobile' ? 'px-1 py-1' : 'px-6 py-4'} bg-gray-100 border-t border-gray-300`}>
          <div className={`${currentTheme === 'mobile' ? 'flex flex-col items-center gap-1' : 'flex flex-col md:flex-row justify-between items-center gap-4'}`}>
            <div className="text-center md:text-left">
              <p className="font-semibold text-gray-900">HotWell.kz</p>
              <p className="text-sm text-gray-600">
                {currentTheme === 'mobile' 
                  ? 'СИП-панели по Казахстану' 
                  : 'Быстровозводимые дома из СИП-панелей по всей Республике Казахстан'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {result.total > 0 && (
        <div className="export-button-container fixed bottom-6 right-6 z-[1000] flex gap-3">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-[10px] border border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Скопировать</span>
          </button>

          <button
            id="pdf-export-btn"
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-3 bg-[#00b347] hover:bg-[#3BB143] text-white rounded-[10px] border border-[#00b347] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      )}
    </>
  );
};

