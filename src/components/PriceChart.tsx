import React, { useState } from 'react';
import {
  Activity,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  Database,
  Info,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Candle, FutureInstrument, FuturePrice, ConsumptionData, ConsumptionPoint } from '../types';

interface PriceChartProps {
  candles: Candle[];
  selectedTicker: string;
  instruments: FutureInstrument[];
  prices: FuturePrice[];
  onSelectTicker: (ticker: string) => void;
  interval: string;
  onChangeInterval: (interval: string) => void;
  isLoading: boolean;
  consumption?: ConsumptionData | null;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  candles,
  selectedTicker,
  instruments,
  prices,
  onSelectTicker,
  interval,
  onChangeInterval,
  isLoading,
  consumption,
}) => {
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [showConsumptionOverlay, setShowConsumptionOverlay] = useState<boolean>(true);
  const [comparisonMode, setComparisonMode] = useState<'all' | 'norm' | 'deviation'>('all');
  const [hoveredMonth, setHoveredMonth] = useState<ConsumptionPoint | null>(null);

  const currentPriceObj = prices.find((p) => p.ticker === selectedTicker) || prices[0];
  const instrument = instruments.find((i) => i.ticker === selectedTicker);

  // SVG Candlestick Chart Dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 60, bottom: 45, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const validCandles = candles.filter((c) => c.high > 0 && c.low > 0);
  const minPrice = validCandles.length > 0 ? Math.min(...validCandles.map((c) => c.low)) : 2.5;
  const maxPrice = validCandles.length > 0 ? Math.max(...validCandles.map((c) => c.high)) : 2.75;
  const priceRange = maxPrice - minPrice || 0.1;
  const maxVolume = validCandles.length > 0 ? Math.max(...validCandles.map((c) => c.volume)) : 1000;

  const candleWidth = Math.max(3, Math.min(16, (chartWidth / (validCandles.length || 1)) * 0.7));

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
  };

  const getVolY = (vol: number) => {
    const volHeight = 55;
    return height - padding.bottom - (vol / (maxVolume || 1)) * volHeight;
  };

  // Seasonal Consumption Overlay Dimensions
  const consHeight = 220;
  const consPadding = { top: 25, right: 50, bottom: 35, left: 45 };
  const consWidth = width - consPadding.left - consPadding.right;
  const consPlotHeight = consHeight - consPadding.top - consPadding.bottom;

  const consCurve = consumption?.monthlyCurve || [];
  const minDemand = 65;
  const maxDemand = 130;
  const demandRange = maxDemand - minDemand;

  const getConsY = (val: number) => {
    return consPadding.top + consPlotHeight - ((val - minDemand) / demandRange) * consPlotHeight;
  };

  const getConsX = (index: number) => {
    return consPadding.left + (index / (Math.max(1, consCurve.length - 1))) * consWidth;
  };

  const currentMonthData = consumption?.currentMonth;
  const isElevatedDemand = (currentMonthData?.deviationFromNormBcfd || 0) > 0;

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-amber-950 border border-amber-800 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                График Henry Hub & Наложение спроса EIA
              </h2>
              <span className="text-xs text-amber-400 font-mono font-bold">
                [{selectedTicker}]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Внутридневные свечи Т-Инвестиций и историческое наложение потребления газа прошлых лет (EIA)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 font-mono text-xs flex-wrap">
          {/* Toggle Consumption Overlay Button */}
          <button
            onClick={() => setShowConsumptionOverlay(!showConsumptionOverlay)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all border ${
              showConsumptionOverlay
                ? 'bg-amber-600 border-amber-500 text-white font-semibold shadow'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-300" />
            <span>Наложение спроса EIA</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                showConsumptionOverlay ? 'bg-amber-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showConsumptionOverlay ? 'ВКЛ' : 'ВЫКЛ'}
            </span>
          </button>

          {/* Interval Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onChangeInterval('CANDLE_INTERVAL_15_MIN')}
              className={`px-2.5 py-1 rounded transition-colors ${
                interval === 'CANDLE_INTERVAL_15_MIN'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              15 Мин
            </button>
            <button
              onClick={() => onChangeInterval('CANDLE_INTERVAL_HOUR')}
              className={`px-2.5 py-1 rounded transition-colors ${
                interval === 'CANDLE_INTERVAL_HOUR'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1 Час
            </button>
          </div>

          {/* Contract Selector */}
          <select
            value={selectedTicker}
            onChange={(e) => onSelectTicker(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {instruments.map((i) => (
              <option key={i.ticker} value={i.ticker}>
                {i.ticker} ({i.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Metric Bar */}
      <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Текущая котировка:</span>
            <span className="text-xl font-bold text-white">
              ${(currentPriceObj?.price || 2.634).toFixed(3)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Экспирация:</span>
            <span className="text-slate-300 font-semibold">
              {instrument?.expirationDate
                ? new Date(instrument.expirationDate).toLocaleDateString('ru-RU')
                : '29.10.2026'}
            </span>
          </div>

          {/* Demand Status Highlight Badge */}
          {consumption && (
            <div className="pl-4 border-l border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Спрос (Октябрь vs Норма):</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">
                  {currentMonthData?.currentEstimatedBcfd} Bcf/d
                </span>
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${
                    isElevatedDemand
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}
                >
                  {isElevatedDemand ? '+' : ''}
                  {currentMonthData?.deviationFromNormBcfd} Bcf/d ({(currentMonthData?.deviationPercent ?? 0) > 0 ? '+' : ''}
                  {currentMonthData?.deviationPercent ?? 0}%)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Сделка: </span>
          <strong className="text-slate-200">
            {currentPriceObj?.time
              ? new Date(currentPriceObj.time).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }) + ' UTC'
              : 'В реальном времени'}
          </strong>
        </div>
      </div>

      {/* Section 1: Candlestick Chart */}
      <div className="p-6">
        {hoveredCandle && (
          <div className="mb-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded font-mono text-xs flex items-center justify-between text-slate-300 flex-wrap gap-2">
            <div>
              <span className="text-slate-500">Время: </span>
              <strong className="text-white">
                {new Date(hoveredCandle.time).toLocaleString('ru-RU')}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">O: </span>
              <span>${hoveredCandle.open.toFixed(3)} </span>
              <span className="text-slate-500">H: </span>
              <span>${hoveredCandle.high.toFixed(3)} </span>
              <span className="text-slate-500">L: </span>
              <span>${hoveredCandle.low.toFixed(3)} </span>
              <span className="text-slate-500">C: </span>
              <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                ${hoveredCandle.close.toFixed(3)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Объём: </span>
              <strong className="text-white">{hoveredCandle.volume.toLocaleString()}</strong>
              {hoveredCandle.volumeBuy > 0 && (
                <span className="text-emerald-400 text-[11px] ml-1.5">
                  (Куп: {hoveredCandle.volumeBuy})
                </span>
              )}
            </div>
          </div>
        )}

        <div className="relative w-full overflow-hidden bg-slate-950 border border-slate-800 rounded-lg p-2 min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10 font-mono text-xs text-blue-400">
              <span className="animate-pulse">Загрузка свечей Т-Инвестиций...</span>
            </div>
          )}

          {!isLoading && validCandles.length === 0 && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-10 font-mono text-xs text-slate-400 gap-2 p-4 text-center">
              <Activity className="w-8 h-8 text-amber-500/80 animate-pulse" />
              <span className="text-white font-semibold">
                Нет свечей за последние 48 часов для {selectedTicker || 'выбранного контракта'}
              </span>
              <span className="text-slate-500 text-[11px]">
                Рынок закрыт или по дальнему контракту не было сделок на MOEX
              </span>
              {instruments.length > 0 && (
                <button
                  onClick={() => onSelectTicker(instruments[0].ticker)}
                  className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors cursor-pointer"
                >
                  Переключить на активный контракт {instruments[0].ticker}
                </button>
              )}
            </div>
          )}

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none overflow-visible"
            onMouseLeave={() => setHoveredCandle(null)}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padding.top + chartHeight * (1 - pct);
              const priceLevel = minPrice + priceRange * pct;
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={width - padding.right + 8}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ${priceLevel.toFixed(3)}
                  </text>
                </g>
              );
            })}

            {/* Candlesticks & Volumes */}
            {validCandles.map((c, i) => {
              const x =
                padding.left +
                (i / (validCandles.length || 1)) * chartWidth +
                candleWidth / 2;
              const isUp = c.close >= c.open;
              const candleColor = isUp ? '#10b981' : '#f43f5e';
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(2, Math.abs(openY - closeY));

              const volY = getVolY(c.volume);
              const volHeight = height - padding.bottom - volY;

              return (
                <g
                  key={c.time}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredCandle(c)}
                >
                  <rect
                    x={x - candleWidth / 2}
                    y={volY}
                    width={candleWidth}
                    height={volHeight}
                    fill={isUp ? '#065f46' : '#881337'}
                    opacity={0.6}
                  />

                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />

                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    rx="1"
                  />
                </g>
              );
            })}

            {/* Time Axis Labels */}
            {validCandles.map((c, i) => {
              if (i % Math.ceil(validCandles.length / 6) === 0) {
                const x = padding.left + (i / validCandles.length) * chartWidth;
                const d = new Date(c.time);
                return (
                  <text
                    key={c.time}
                    x={x}
                    y={height - 12}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {d.getHours()}:00
                  </text>
                );
              }
              return null;
            })}
          </svg>
        </div>

        {/* Section 2: Historical Gas Consumption Overlay (EIA) */}
        {showConsumptionOverlay && consumption && (
          <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono animate-fade-in">
            {/* Overlay Header & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Наложение: Потребление природного газа в аналогичные периоды прошлых лет (EIA)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Сравнение текущего сезонного спроса с 5-летней климатической нормой и уровнями 2023, 2024, 2025 гг.
                </p>
              </div>

              {/* Comparison Mode Filter */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setComparisonMode('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    comparisonMode === 'all'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Все годы (2023–2026 + 5Y норма)
                </button>
                <button
                  onClick={() => setComparisonMode('norm')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    comparisonMode === 'norm'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Только 5-летняя норма
                </button>
                <button
                  onClick={() => setComparisonMode('deviation')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    comparisonMode === 'deviation'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Отклонение (Δ %)
                </button>
              </div>
            </div>

            {/* Current Anomaly Callout Banner */}
            <div className="mb-4 p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded ${
                    isElevatedDemand ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}
                >
                  {isElevatedDemand ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase">
                      Текущий спрос (Октябрь 2026): {currentMonthData?.currentEstimatedBcfd} Bcf/d
                    </span>
                    <span className="text-slate-500">vs</span>
                    <span className="text-amber-300 font-semibold">
                      5-летняя норма: {currentMonthData?.fiveYearAvgBcfd} Bcf/d
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Отклонение от нормы:{' '}
                    <strong className={isElevatedDemand ? 'text-emerald-300' : 'text-rose-300'}>
                      {isElevatedDemand ? '+' : ''}
                      {currentMonthData?.deviationFromNormBcfd} Bcf/d ({(currentMonthData?.deviationPercent ?? 0) > 0 ? '+' : ''}
                      {currentMonthData?.deviationPercent ?? 0}%)
                    </strong>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-slate-300">{currentMonthData?.marketImpact}</span>
                  </div>
                </div>
              </div>

              {/* Historical Analog Quick Summary */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Окт 2025: <strong className="text-purple-300">{currentMonthData?.year2025Bcfd}</strong></span>
                <span>Окт 2024: <strong className="text-cyan-300">{currentMonthData?.year2024Bcfd}</strong></span>
                <span>Окт 2023: <strong className="text-slate-300">{currentMonthData?.year2023Bcfd}</strong></span>
              </div>
            </div>

            {/* Hover Tooltip for Month */}
            {hoveredMonth && (
              <div className="mb-2 p-2.5 rounded bg-slate-900 border border-slate-700 text-xs flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-white uppercase">{hoveredMonth.monthName}</span>
                <div className="flex items-center gap-3 text-[11px]">
                  {hoveredMonth.actual2026Bcfd !== null && (
                    <span className="text-blue-400 font-semibold">
                      2026: {hoveredMonth.actual2026Bcfd} Bcf/d
                    </span>
                  )}
                  <span className="text-amber-400">5Y Норма: {hoveredMonth.fiveYearAvgBcfd} Bcf/d</span>
                  <span className="text-purple-400">2025: {hoveredMonth.year2025Bcfd} Bcf/d</span>
                  <span className="text-cyan-400">2024: {hoveredMonth.year2024Bcfd} Bcf/d</span>
                  <span className="text-slate-400">2023: {hoveredMonth.year2023Bcfd} Bcf/d</span>
                  {hoveredMonth.deviationFromNormBcfd !== null && hoveredMonth.deviationFromNormBcfd !== undefined && (
                    <span
                      className={`font-bold ${
                        hoveredMonth.deviationFromNormBcfd > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      Δ: {hoveredMonth.deviationFromNormBcfd > 0 ? '+' : ''}
                      {hoveredMonth.deviationFromNormBcfd} Bcf/d ({hoveredMonth.deviationPercent}%)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* SVG Seasonal Demand Curves */}
            <div className="relative w-full overflow-hidden bg-slate-950 rounded-lg p-2 border border-slate-800/80">
              <svg
                viewBox={`0 0 ${width} ${consHeight}`}
                className="w-full h-auto select-none overflow-visible"
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {/* Horizontal Grid Lines */}
                {[70, 80, 90, 100, 110, 120].map((level) => {
                  const y = getConsY(level);
                  return (
                    <g key={level}>
                      <line
                        x1={consPadding.left}
                        y1={y}
                        x2={width - consPadding.right}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="2 2"
                      />
                      <text
                        x={consPadding.left - 8}
                        y={y + 3}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {level}
                      </text>
                    </g>
                  );
                })}

                {/* 5-Year Normal Shaded Corridor Band */}
                <path
                  d={
                    consCurve.reduce((acc, pt, i) => {
                      const x = getConsX(i);
                      const y = getConsY(pt.normMaxBcfd);
                      return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }, '') +
                    consCurve
                      .slice()
                      .reverse()
                      .reduce((acc, pt, i) => {
                        const originalIndex = consCurve.length - 1 - i;
                        const x = getConsX(originalIndex);
                        const y = getConsY(pt.normMinBcfd);
                        return `${acc} L ${x} ${y}`;
                      }, '') +
                    ' Z'
                  }
                  fill="#f59e0b"
                  fillOpacity="0.08"
                />

                {/* Historical Curves */}
                {comparisonMode === 'all' && (
                  <>
                    {/* 2023 Line (Slate) */}
                    <path
                      d={consCurve.reduce((acc, pt, i) => {
                        const x = getConsX(i);
                        const y = getConsY(pt.year2023Bcfd);
                        return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />

                    {/* 2024 Line (Cyan) */}
                    <path
                      d={consCurve.reduce((acc, pt, i) => {
                        const x = getConsX(i);
                        const y = getConsY(pt.year2024Bcfd);
                        return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                    />

                    {/* 2025 Line (Purple) */}
                    <path
                      d={consCurve.reduce((acc, pt, i) => {
                        const x = getConsX(i);
                        const y = getConsY(pt.year2025Bcfd);
                        return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1.8"
                    />
                  </>
                )}

                {/* 5-Year Average Seasonal Norm Line (Golden Dashed) */}
                <path
                  d={consCurve.reduce((acc, pt, i) => {
                    const x = getConsX(i);
                    const y = getConsY(pt.fiveYearAvgBcfd);
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.2"
                  strokeDasharray="4 2"
                />

                {/* 2026 Current Year Line (Bold Blue) */}
                <path
                  d={consCurve
                    .filter((pt) => pt.actual2026Bcfd !== null)
                    .reduce((acc, pt, i) => {
                      const x = getConsX(pt.monthIndex);
                      const y = getConsY(pt.actual2026Bcfd || 0);
                      return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }, '')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />

                {/* Current Period Highlight (October) */}
                {(() => {
                  const octIdx = 9;
                  const x = getConsX(octIdx);
                  const pt = consCurve[octIdx];
                  if (!pt || pt.actual2026Bcfd === null) return null;
                  const curY = getConsY(pt.actual2026Bcfd || 80.6);
                  const normY = getConsY(pt.fiveYearAvgBcfd);

                  return (
                    <g key="current-october">
                      {/* Vertical Reference Line */}
                      <line
                        x1={x}
                        y1={consPadding.top}
                        x2={x}
                        y2={consHeight - consPadding.bottom}
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />

                      {/* Deviation Arrow / Connector */}
                      <line
                        x1={x}
                        y1={curY}
                        x2={x}
                        y2={normY}
                        stroke={isElevatedDemand ? '#10b981' : '#f43f5e'}
                        strokeWidth="3"
                      />

                      {/* Norm Point */}
                      <circle cx={x} cy={normY} r="4" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />

                      {/* Current Point (Pulsing blue dot) */}
                      <circle cx={x} cy={curY} r="7" fill="#3b82f6" fillOpacity="0.4" />
                      <circle cx={x} cy={curY} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

                      {/* October Callout Text */}
                      <text
                        x={x + 8}
                        y={curY - 6}
                        fill="#38bdf8"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        Окт 2026: {pt.actual2026Bcfd} Bcf/d
                      </text>
                    </g>
                  );
                })()}

                {/* Interactive Points on Month Columns */}
                {consCurve.map((pt, i) => {
                  const x = getConsX(i);
                  return (
                    <g
                      key={pt.monthName}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredMonth(pt)}
                    >
                      <rect
                        x={x - 15}
                        y={consPadding.top}
                        width="30"
                        height={consPlotHeight}
                        fill="transparent"
                      />
                      {/* Month Label */}
                      <text
                        x={x}
                        y={consHeight - 12}
                        fill={i === 9 ? '#38bdf8' : '#64748b'}
                        fontWeight={i === 9 ? 'bold' : 'normal'}
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {pt.monthName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend & Sector Indicators */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              {/* Legend Badges */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-500 rounded"></span>
                  <span className="text-slate-200 font-semibold">2026 (Текущий спрос)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400 border-dashed border-t border-amber-400"></span>
                  <span className="text-amber-300">5-летняя климатическая норма</span>
                </div>
                {comparisonMode === 'all' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-purple-500 rounded"></span>
                      <span>2025</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-cyan-400 rounded"></span>
                      <span>2024</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-slate-500 rounded"></span>
                      <span>2023</span>
                    </div>
                  </>
                )}
              </div>

              {/* EIA Source Timestamp */}
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>{consumption.meta.dataEffectivePeriod}</span>
              </div>
            </div>

            {/* Consumption Sector Breakdown Cards */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {consumption.sectors.map((sec, i) => (
                <div key={i} className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-200 font-medium">{sec.sector}</span>
                    <span className="text-amber-400 font-bold">{sec.currentBcfd} Bcf/d</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Доля: {sec.sharePercent}%</span>
                    <span className="text-slate-500 truncate max-w-[150px]">{sec.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOEX / T-Bank Active Gas Contracts Table */}
        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-semibold uppercase">
              Срочная структура Henry Hub (MOEX Фьючерсы в Т-Инвестициях):
            </span>
            <span className="text-slate-500 text-[11px]">{instruments.length} активных серий</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {instruments.slice(0, 8).map((inst) => {
              const p = prices.find((pr) => pr.ticker === inst.ticker)?.price;
              const isSelected = inst.ticker === selectedTicker;
              return (
                <div
                  key={inst.ticker}
                  onClick={() => onSelectTicker(inst.ticker)}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/80 border-blue-600 text-white'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <strong className="text-white">{inst.ticker}</strong>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(inst.expirationDate).toLocaleDateString('ru-RU', { month: '2-digit', year: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm font-bold mt-1 text-emerald-400">
                    {p !== undefined ? `$${p.toFixed(3)}` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
