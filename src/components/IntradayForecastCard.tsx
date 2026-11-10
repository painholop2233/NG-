import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sliders,
  AlertTriangle,
  Clock,
  Compass,
  Zap,
  RotateCcw,
  ShieldCheck,
  Flame,
  HelpCircle,
  X,
  CheckCircle2,
  BarChart2,
  Target,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { IntradayForecast, FutureInstrument, FuturePrice } from '../types';

interface IntradayForecastCardProps {
  forecast: IntradayForecast | null;
  onSimulate: (tempShift: number, feedgasShift: number, storageShift: number, ticker?: string) => void;
  isSimulating: boolean;
  instruments?: FutureInstrument[];
  prices?: FuturePrice[];
  selectedTicker?: string;
  onSelectTicker?: (ticker: string) => void;
}

export const IntradayForecastCard: React.FC<IntradayForecastCardProps> = ({
  forecast,
  onSimulate,
  isSimulating,
  instruments = [],
  prices = [],
  selectedTicker,
  onSelectTicker,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<'intraday' | 'multiDay'>('intraday');
  const [tempShift, setTempShift] = useState(0);
  const [feedgasShift, setFeedgasShift] = useState(0);
  const [storageShift, setStorageShift] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const activeTicker = selectedTicker || forecast?.frontContract || 'NGX6';

  if (!forecast) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-800 rounded mb-4"></div>
        <div className="h-40 bg-slate-800 rounded"></div>
      </div>
    );
  }

  // Active horizon data with fallback to root forecast
  const activeHorizonData =
    forecast.horizons && forecast.horizons[selectedHorizon]
      ? forecast.horizons[selectedHorizon]
      : {
          horizon: selectedHorizon === 'intraday' ? ('INTRADAY' as const) : ('MULTI_DAY' as const),
          horizonLabel: selectedHorizon === 'intraday' ? 'Интрадей (1–6 часов)' : 'На 1–2 дня (24–48 часов)',
          signal: forecast.signal,
          signalRussian: forecast.signalRussian,
          color: forecast.color,
          compositeScore: forecast.compositeScore,
          confidencePercent: forecast.confidencePercent,
          targetPrice: forecast.targetPrice,
          targetRange: forecast.targetRange,
          tradePlan: forecast.tradePlan,
          factors: forecast.factors,
          keyCatalysts: forecast.keyCatalysts,
        };

  const tradePlan = activeHorizonData.tradePlan || forecast.tradePlan;
  const factors = activeHorizonData.factors || forecast.factors;
  const keyCatalysts = activeHorizonData.keyCatalysts || forecast.keyCatalysts;
  const targetPrice = activeHorizonData.targetPrice ?? forecast.targetPrice;
  const targetRange = activeHorizonData.targetRange ?? forecast.targetRange;
  const compositeScore = activeHorizonData.compositeScore ?? forecast.compositeScore;
  const confidencePercent = activeHorizonData.confidencePercent ?? forecast.confidencePercent;
  const signal = activeHorizonData.signal || forecast.signal;
  const signalRussian = activeHorizonData.signalRussian || forecast.signalRussian;

  const handleApplySimulation = (t: number, f: number, s: number) => {
    setTempShift(t);
    setFeedgasShift(f);
    setStorageShift(s);
    onSimulate(t, f, s, activeTicker);
  };

  const handleReset = () => {
    setTempShift(0);
    setFeedgasShift(0);
    setStorageShift(0);
    onSimulate(0, 0, 0, activeTicker);
  };

  const hasSimulation = tempShift !== 0 || feedgasShift !== 0 || storageShift !== 0;

  // Signal styling for active horizon
  const isBullish = signal === 'BULLISH';
  const isBearish = signal === 'BEARISH';
  const signalColor = isBullish
    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80'
    : isBearish
    ? 'text-rose-400 bg-rose-950/60 border-rose-800/80'
    : 'text-amber-400 bg-amber-950/60 border-amber-800/80';

  const gaugePercent = Math.min(100, Math.max(0, ((compositeScore + 100) / 200) * 100));

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-blue-950 border border-blue-800 text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Прогноз Цены Henry Hub &amp; План Сделки
              </h2>
              <span className="text-xs text-blue-400 font-mono font-semibold px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800">
                {activeTicker} {forecast.contractName ? `(${forecast.contractName.split(' ')[0]})` : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Синтез потока сделок (CVD), ATR волатильности, погодных ансамблей ECMWF/GFS и баланса EIA
            </p>
          </div>
        </div>

        {/* Timestamps Info */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Расчёт сформирован:</span>
          <strong className="text-slate-200">
            {new Date(forecast.generatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </strong>
        </div>
      </div>

      {/* Horizon Switcher Tabs */}
      <div className="px-6 py-2.5 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 uppercase text-[11px] font-bold tracking-wider">
            Горизонт прогнозирования:
          </span>
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedHorizon('intraday')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedHorizon === 'intraday'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Интрадей (1–6 часов)</span>
              {forecast.horizons?.intraday && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    forecast.horizons.intraday.signal === 'BULLISH'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : forecast.horizons.intraday.signal === 'BEARISH'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {forecast.horizons.intraday.signalRussian}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedHorizon('multiDay')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedHorizon === 'multiDay'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>На 1–2 дня (24–48 часов)</span>
              {forecast.horizons?.multiDay && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    forecast.horizons.multiDay.signal === 'BULLISH'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : forecast.horizons.multiDay.signal === 'BEARISH'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {forecast.horizons.multiDay.signalRussian}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Активен режим:{' '}
          <strong className="text-white">
            {selectedHorizon === 'intraday' ? 'Таймфрейм M15/H1 (Скальп/Дейтрейдинг)' : 'Таймфрейм H4/D1 (Свинг-трейдинг)'}
          </strong>
        </div>
      </div>

      {/* Technicals & Order Flow CVD Ribbon */}
      {forecast.technicals && (
        <div className="px-6 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            {/* CVD Delta Meter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Дельта объёма (CVD):</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">{forecast.technicals.buyerAdvantagePercent}%</span>
                <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${forecast.technicals.buyerAdvantagePercent}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${forecast.technicals.sellerAdvantagePercent}%` }}
                  />
                </div>
                <span className="text-rose-400 font-bold">{forecast.technicals.sellerAdvantagePercent}%</span>
                <span
                  className={`text-[10px] px-1 rounded font-bold ${
                    forecast.technicals.volumeDeltaPercent >= 0
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {forecast.technicals.volumeDeltaPercent >= 0 ? '+' : ''}
                  {forecast.technicals.volumeDeltaPercent}%
                </span>
              </div>
            </div>

            {/* ATR-14 */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">ATR(14):</span>
              <strong className="text-amber-300 font-bold">${forecast.technicals.atr14.toFixed(3)}</strong>
              <span className="text-[10px] text-slate-500 font-sans">
                ({Math.round(forecast.technicals.atr14 * 1000)} пунктов шума)
              </span>
            </div>

            {/* VWAP */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">VWAP:</span>
              <strong className="text-cyan-300 font-bold">${forecast.technicals.vwap.toFixed(3)}</strong>
              <span
                className={`text-[10px] ${
                  forecast.currentPrice >= forecast.technicals.vwap ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ({forecast.currentPrice >= forecast.technicals.vwap ? 'выше' : 'ниже'})
              </span>
            </div>

            {/* RSI-14 */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">RSI(14):</span>
              <strong
                className={
                  forecast.technicals.rsi14 >= 70
                    ? 'text-rose-400'
                    : forecast.technicals.rsi14 <= 30
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                }
              >
                {forecast.technicals.rsi14}
              </strong>
            </div>
          </div>

          {/* Regime Badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Структура:</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
                forecast.technicals.trendRegime === 'TRENDING_UP'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : forecast.technicals.trendRegime === 'TRENDING_DOWN'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}
            >
              {forecast.technicals.trendRegimeRussian}
            </span>
          </div>
        </div>
      )}

      {/* Active Futures Contract Selector Bar */}
      <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-semibold text-[11px]">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Выбор фьючерса:</span>
          </span>

          {/* Quick select buttons for the most active contracts */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {instruments && instruments.length > 0
              ? instruments.slice(0, 4).map((inst) => {
                  const p = prices.find((pr) => pr.ticker === inst.ticker);
                  const isSelected = activeTicker === inst.ticker;
                  return (
                    <button
                      key={inst.ticker}
                      type="button"
                      onClick={() => onSelectTicker && onSelectTicker(inst.ticker)}
                      disabled={isSimulating}
                      className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white font-bold shadow-sm ring-1 ring-blue-500/50'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title={`${inst.name} (Экспирация: ${new Date(inst.expirationDate).toLocaleDateString('ru-RU')})`}
                    >
                      <span className="font-semibold">{inst.ticker}</span>
                      {p && (
                        <span className={`text-[11px] ${isSelected ? 'text-blue-100 font-mono' : 'text-slate-400'}`}>
                          ${p.price.toFixed(3)}
                        </span>
                      )}
                    </button>
                  );
                })
              : (
                <div className="text-slate-400 text-xs">Загрузка контрактов...</div>
              )}
          </div>

          {/* Complete Dropdown for All Available Futures */}
          {instruments && instruments.length > 0 && (
            <div className="flex items-center gap-1 ml-1">
              <select
                value={activeTicker}
                onChange={(e) => onSelectTicker && onSelectTicker(e.target.value)}
                disabled={isSimulating}
                className="bg-slate-900 border border-slate-700 hover:border-slate-500 rounded px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                aria-label="Выбрать фьючерс"
              >
                {instruments.map((inst) => {
                  const p = prices.find((pr) => pr.ticker === inst.ticker);
                  const expDate = inst.expirationDate
                    ? new Date(inst.expirationDate).toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })
                    : '';
                  return (
                    <option key={inst.ticker} value={inst.ticker}>
                      {inst.ticker} ({expDate}) {p ? `— $${p.price.toFixed(3)}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Real-time Recalculation Status */}
        <div className="flex items-center gap-2">
          {isSimulating ? (
            <div className="flex items-center gap-1.5 text-amber-400 animate-pulse text-[11px]">
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              <span>Пересчёт по фьючерсу {activeTicker}...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>
                Прогноз пересчитан по{' '}
                <strong className="text-emerald-300 font-mono">{activeTicker}</strong>
                {forecast.contractExpiration && (
                  <span className="text-slate-500 ml-1">
                    (эксп: {new Date(forecast.contractExpiration).toLocaleDateString('ru-RU')})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Trade Parameters & Risk Execution Section */}
      {tradePlan && (
        <div className="px-6 pt-5 pb-2 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-400">
                <Target className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Параметры Сделки и Управление Риском ({activeHorizonData.horizonLabel})
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                      tradePlan.action === 'BUY'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : tradePlan.action === 'SELL'
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : 'bg-amber-950 text-amber-300 border-amber-700'
                    }`}
                  >
                    {tradePlan.actionRussian}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Расчётные уровни входа, фиксации прибыли (TP1 / TP2), динамического стопа (SL на основе ATR) и горизонта выхода для фьючерса {activeTicker}
                </p>
              </div>
            </div>

            {/* Risk/Reward Badge */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Соотношение R:R:</span>
                <span className="text-white font-bold text-sm">
                  {tradePlan.riskRewardRatio} : 1
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded font-semibold">
                  Прибыль / Риск
                </span>
              </div>
            </div>
          </div>

          {/* 4 Execution Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3 font-mono">
            {/* 1. Entry Point */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="uppercase text-[10px] tracking-wider text-slate-300 flex items-center gap-1 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                    Точка входа (Entry)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                    {tradePlan.action === 'BUY' ? 'LONG' : tradePlan.action === 'SELL' ? 'SHORT' : 'RANGE'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  ${tradePlan.entryPrice.toFixed(3)}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ MMBtu</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Зона набора: <strong className="text-slate-200">${tradePlan.entryRange.low.toFixed(3)} – ${tradePlan.entryRange.high.toFixed(3)}</strong>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/70 text-[10px] text-slate-400 font-sans leading-snug">
                {tradePlan.entryCondition}
              </div>
            </div>

            {/* 2. Take-Profit */}
            <div className="bg-slate-900/90 border border-emerald-900/50 rounded-lg p-3.5 flex flex-col justify-between hover:border-emerald-700/60 transition-colors bg-gradient-to-b from-slate-900/90 to-emerald-950/20">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="uppercase text-[10px] tracking-wider text-emerald-400 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Тейк-профит (TP)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    +{tradePlan.takeProfitPercent}%
                  </span>
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  ${tradePlan.takeProfit.toFixed(3)}
                  <span className="text-xs text-emerald-500/90 font-normal ml-1.5">
                    (+${tradePlan.takeProfitDelta.toFixed(3)})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Цель TP2 (расшир.): <strong className="text-emerald-300">${tradePlan.takeProfit2.toFixed(3)}</strong>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/70 text-[10px] text-emerald-300/80 font-sans leading-snug">
                Фиксация 50% объема на TP1, перенос стопа в безубыток при достижении TP1.
              </div>
            </div>

            {/* 3. Stop-Loss */}
            <div className="bg-slate-900/90 border border-rose-900/50 rounded-lg p-3.5 flex flex-col justify-between hover:border-rose-700/60 transition-colors bg-gradient-to-b from-slate-900/90 to-rose-950/20">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="uppercase text-[10px] tracking-wider text-rose-400 flex items-center gap-1 font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Стоп-лосс (SL)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                    -{tradePlan.stopLossPercent}%
                  </span>
                </div>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  ${tradePlan.stopLoss.toFixed(3)}
                  <span className="text-xs text-rose-500/90 font-normal ml-1.5">
                    (-${tradePlan.stopLossDelta.toFixed(3)})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Риск: <strong className="text-rose-300">{tradePlan.stopLossTicks} пунктов</strong> (${(tradePlan.stopLossTicks * 10).toFixed(0)} / контр.)
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/70 text-[10px] text-rose-300/80 font-sans leading-snug">
                Динамический защитный стоп с запасом на рыночный шум по ATR.
              </div>
            </div>

            {/* 4. Exit Rules & Horizon */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="uppercase text-[10px] tracking-wider text-slate-300 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Выход из сделки (Exit)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Тайминг
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1 leading-snug">
                  {tradePlan.exitHorizon}
                </div>
                <div className="text-[11px] text-amber-300/90 mt-1 truncate" title={tradePlan.trailingStopRule}>
                  Трейлинг: <span className="text-slate-300 font-sans">{tradePlan.trailingStopRule.split('при')[0]}</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/70 text-[10px] text-slate-400 font-sans leading-snug">
                {tradePlan.riskManagementNote}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Verdict & Gauge (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          <div className={`p-5 rounded-lg border ${signalColor} transition-all relative`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  title="Как идёт расчёт и почему именно такой сигнал?"
                  className="w-5 h-5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/70 flex items-center justify-center transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                  aria-label="Справка о расчёте прогноза и сигнале"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  {activeHorizonData.horizonLabel}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                Уверенность: {confidencePercent}%
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-slate-950/70 border border-slate-700">
                {isBullish && <TrendingUp className="w-8 h-8 text-emerald-400" />}
                {isBearish && <TrendingDown className="w-8 h-8 text-rose-400" />}
                {!isBullish && !isBearish && <Minus className="w-8 h-8 text-amber-400" />}
              </div>
              <div>
                <div className="text-2xl font-black font-mono tracking-tight text-white uppercase">
                  {signalRussian}
                </div>
                <div className="text-xs font-mono text-slate-300 mt-0.5">
                  Композитный индекс импульса:{' '}
                  <strong className={isBullish ? 'text-emerald-300' : isBearish ? 'text-rose-300' : 'text-amber-300'}>
                    {compositeScore > 0 ? '+' : ''}
                    {compositeScore}
                  </strong>{' '}
                  / 100
                </div>
              </div>
            </div>

            {/* Target Price Metrics */}
            <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80 font-mono">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Цель горизонта ({activeTicker}):</span>
                <span className="text-xl font-bold text-white">${targetPrice.toFixed(3)}</span>
                <span className="text-xs text-slate-400 ml-1">/ MMBtu</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Диапазон волатильности:</span>
                <span className="text-sm font-semibold text-slate-200">
                  ${targetRange.low.toFixed(3)} – ${targetRange.high.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  (база {activeTicker}: ${forecast.currentPrice.toFixed(3)})
                </span>
              </div>
            </div>
          </div>

          {/* Scale Gauge Indicator */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span className="text-rose-400 font-semibold">-100 Медвежий</span>
              <span className="text-slate-400">0 Нейтрально</span>
              <span className="text-emerald-400 font-semibold">+100 Бычий</span>
            </div>
            <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 opacity-80" />
              <div
                className="absolute top-0 bottom-0 w-3 bg-white rounded-full shadow-lg border-2 border-slate-900 transition-all duration-300 transform -translate-x-1/2"
                style={{ left: `${gaugePercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Баланс факторов: {factors.length} метрик</span>
              </span>
              <span className="text-slate-300 font-medium">
                Сдвиг: {(((targetPrice - forecast.currentPrice) / forecast.currentPrice) * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Key Catalysts */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Главные рыночные триггеры ({activeHorizonData.horizonLabel}):</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {keyCatalysts.map((cat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono select-none">▸</span>
                  <span>{cat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Factors Breakdown & Scenario Simulator (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Factor Breakdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Декомпозиция весов модели ({activeHorizonData.horizonLabel})
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Вес: 100%</span>
            </div>

            <div className="space-y-3 font-mono">
              {factors.map((f, i) => {
                const scorePositive = f.score >= 0;
                return (
                  <div key={i} className="border-b border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-medium">{f.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">[{f.weightPercent}%]</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            f.score > 10
                              ? 'text-emerald-400'
                              : f.score < -10
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {scorePositive ? '+' : ''}
                          {f.score}
                        </span>
                        <span className="text-[10px] text-slate-400">({f.status})</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          f.score > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(8, Math.abs(f.score)))}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{f.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Scenario Simulator */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Сценарный симулятор трейдера (Stress-Test)
                </h3>
              </div>
              {hasSimulation && (
                <button
                  onClick={handleReset}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Сбросить симуляцию</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4 font-sans">
              Протестируйте, как изменится внутридневной прогноз при температурном сдвиге в США, скачке номинаций СПГ или сюрпризе EIA:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Temp Shift */}
              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Сдвиг темп. США:</span>
                  <strong className={tempShift < 0 ? 'text-blue-400' : tempShift > 0 ? 'text-amber-400' : 'text-slate-400'}>
                    {tempShift > 0 ? `+${tempShift}` : tempShift}°C
                  </strong>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.5"
                  value={tempShift}
                  onChange={(e) => handleApplySimulation(Number(e.target.value), feedgasShift, storageShift)}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>-3°C (Холод)</span>
                  <span>0°C</span>
                  <span>+3°C (Тепло)</span>
                </div>
              </div>

              {/* Feedgas Shift */}
              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>СПГ отбор (Feedgas):</span>
                  <strong className={feedgasShift > 0 ? 'text-emerald-400' : feedgasShift < 0 ? 'text-rose-400' : 'text-slate-400'}>
                    {feedgasShift > 0 ? `+${feedgasShift}` : feedgasShift} Bcf/d
                  </strong>
                </div>
                <input
                  type="range"
                  min="-2.5"
                  max="2.0"
                  step="0.5"
                  value={feedgasShift}
                  onChange={(e) => handleApplySimulation(tempShift, Number(e.target.value), storageShift)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>-2.5 Bcf</span>
                  <span>База</span>
                  <span>+2.0 Bcf</span>
                </div>
              </div>

              {/* Storage Shift */}
              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Сюрприз запасов EIA:</span>
                  <strong className={storageShift > 0 ? 'text-rose-400' : storageShift < 0 ? 'text-emerald-400' : 'text-slate-400'}>
                    {storageShift > 0 ? `+${storageShift}` : storageShift} Bcf
                  </strong>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="25"
                  step="5"
                  value={storageShift}
                  onChange={(e) => handleApplySimulation(tempShift, feedgasShift, Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>-25 (Дефицит)</span>
                  <span>0</span>
                  <span>+25 (Профицит)</span>
                </div>
              </div>
            </div>

            {hasSimulation && (
              <div className="mt-3 p-2 bg-blue-950/40 border border-blue-800/60 rounded text-xs text-blue-300 flex items-center justify-between">
                <span>
                  Активен стресс-сценарий: темп. {tempShift > 0 ? `+${tempShift}` : tempShift}°C, СПГ {feedgasShift} Bcf/d, хранилища {storageShift} Bcf.
                </span>
                <span className="font-bold text-white">Цель: ${forecast.targetPrice.toFixed(3)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Modal: Explanation of Calculation & Current Signal Rationale */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Как рассчитывается прогноз и почему такой сигнал?
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Методология расчёта, математическая формула и текущее обоснование модели
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                aria-label="Закрыть справку"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* 1. Current Verdict Rationale */}
              <div className={`p-4 rounded-lg border ${signalColor} bg-slate-950/80`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase tracking-wider text-xs">
                    Текущий сигнал: {forecast.signalRussian}
                  </span>
                  <span className="font-bold">Индекс: {forecast.compositeScore > 0 ? '+' : ''}{forecast.compositeScore} / 100</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                  {forecast.signal === 'BEARISH' && (
                    <>
                      Сигнал <strong>МЕДВЕЖИЙ</strong> обусловлен преобладанием факторов навеса предложения:
                      значительный профицит активных запасов в хранилищах EIA над 5-летней климатической нормой (+104 Bcf),
                      устойчиво высокая сухая добыча в США (~103.8 Bcf/d) и отсутствие экстремальных арктических морозов
                      в прогнозах GFS и ECMWF на ключевые дни 2–4 в отопительных центрах Северо-Востока и Среднего Запада.
                    </>
                  )}
                  {forecast.signal === 'BULLISH' && (
                    <>
                      Сигнал <strong>БЫЧИЙ</strong> сформирован за счёт холодного погодного импульса:
                      модели GFS и ECMWF на горизонте 2–4 дней прогнозируют отрицательные температурные аномалии,
                      что резко увеличивает число градусов отопительного периода (HDD) и повышает суточный расход газа,
                      при сохранении высокого отбора газа экспортными заводами СПГ (~14.4 Bcf/d).
                    </>
                  )}
                  {forecast.signal === 'NEUTRAL' && (
                    <>
                      Сигнал <strong>НЕЙТРАЛЬНЫЙ</strong> отражает равновесие разнонаправленных рыночных драйверов:
                      умеренно мягкая погода и достаточные запасы в хранилищах уравновешиваются высокой загрузкой
                      экспортных СПГ-терминалов (свыше 92%) и устойчивой внутридневной поддержкой котировок покупателями.
                    </>
                  )}
                </p>
              </div>

              {/* 2. Dual-Horizon Architecture */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-slate-200 font-bold uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Двухгоризонтная архитектура модели (Интрадей vs 1–2 Дня)</span>
                </div>
                <div className="space-y-2 text-[11px] font-sans text-slate-300">
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-amber-300 font-mono block text-xs mb-1">
                      1. Горизонт «Интрадей (1–6 часов)» — Таймфрейм M15/H1:
                    </strong>
                    Фокусируется на микроструктуре рынка: дельта покупателей/продавцов по реальным тикам (CVD 30%), технический импульс EMA9/EMA21/RSI14 (25%), оперативная погодная сводка дня (25%), суточный отбор СПГ (15%) и фоновые запасы (5%). Стоп и тейк рассчитываются адаптивно по 14-периодному ATR.
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-cyan-300 font-mono block text-xs mb-1">
                      2. Горизонт «На 1–2 дня (24–48 часов)» — Таймфрейм H4/D1:
                    </strong>
                    Фокусируется на фундаментальном балансе: спред моделей ECMWF vs GFS и траектория HDD на дни 2–4 (45%), профицит хранилищ EIA над 5-летней нормой (25%), сухая добыча США (15%) и загрузка экспортных терминалов СПГ (15%). Рассчитан на позиционную отработку фундаментала.
                  </div>
                </div>
              </div>

              {/* 3. ATR Dynamic Risk Management */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 uppercase tracking-wider block mb-2 text-xs">
                  3. Управление риском и адаптивный стоп (ATR Protection):
                </span>
                <p className="text-[11px] font-sans text-slate-300 leading-relaxed mb-2">
                  Предыдущие фиксированные стопы (28 тиков) часто выбивались случайным рыночным шумом природного газа. Теперь уровень Stop-Loss динамически привязан к текущей волатильности:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-amber-400 block mb-0.5">Интрадей SL = 1.35 × ATR(14)</strong>
                    <span className="text-slate-400 font-sans text-[10px]">
                      Учитывает размах свечей за последние 3.5 часа, отсекая ложные проколы. Тейк-профит: 2.15 × ATR (R:R &gt; 1.6:1).
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-cyan-400 block mb-0.5">Свинг 1-2Д SL = 2.0 × ATR(14)</strong>
                    <span className="text-slate-400 font-sans text-[10px]">
                      Даёт запас на суточные колебания. Тейк-профит: 3.3 × ATR (R:R &gt; 1.65:1), цель TP2 до 5.2 × ATR.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-sans">
                Модель обновляется в реальном времени при изменении котировок или погодных данных
              </span>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition-colors cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
