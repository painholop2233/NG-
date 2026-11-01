import React from 'react';
import { Activity, Clock, RefreshCw, Zap, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { FutureInstrument, FuturePrice, IntradayForecast } from '../types';

interface NavbarProps {
  instruments: FutureInstrument[];
  prices: FuturePrice[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  forecast: IntradayForecast | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: Date;
  onOpenProvenance: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  instruments,
  prices,
  selectedTicker,
  onSelectTicker,
  forecast,
  isRefreshing,
  onRefresh,
  lastUpdated,
  onOpenProvenance,
}) => {
  const currentPriceObj = prices.find((p) => p.ticker === selectedTicker) || prices[0];
  const priceVal = currentPriceObj?.price ?? 2.634;

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Market Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-amber-500 flex items-center justify-center font-black text-white text-sm shadow">
                HH
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-white font-mono uppercase">
                    Henry Hub Gas Terminal
                  </h1>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>GFS · ECMWF</span>
                  <span aria-hidden="true">/</span>
                  <span>EIA Storage & Prod</span>
                  <span aria-hidden="true">/</span>
                  <span>T-Invest Live</span>
                </div>
              </div>
            </div>

            {/* Quick Contract Selector */}
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded p-1 ml-4 text-xs font-mono">
              <span className="text-slate-500 px-2 uppercase font-medium">Фьючерс:</span>
              <div className="flex items-center gap-1">
                {(instruments.slice(0, 4) || []).map((inst) => {
                  const p = prices.find((pr) => pr.ticker === inst.ticker)?.price;
                  const isSelected = inst.ticker === selectedTicker;
                  return (
                    <button
                      key={inst.ticker}
                      onClick={() => onSelectTicker(inst.ticker)}
                      className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span>{inst.ticker}</span>
                      {p !== undefined && (
                        <span className={isSelected ? 'text-blue-100' : 'text-slate-500'}>
                          ${p.toFixed(3)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-time Ticker & Forecast Pill */}
          <div className="flex items-center gap-4">
            {/* Live Price Display */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded px-3 py-1.5 font-mono">
              <div className="text-right">
                <div className="text-[10px] uppercase text-slate-400 tracking-wider flex items-center justify-end gap-1">
                  <span>{selectedTicker} Spot Front-Month</span>
                  <span className="text-emerald-400 text-[10px]">● Live</span>
                </div>
                <div className="text-lg font-bold text-slate-100 leading-tight flex items-center gap-1.5 justify-end">
                  <span>${priceVal.toFixed(3)}</span>
                  <span className="text-xs text-slate-400 font-normal">/ MMBtu</span>
                </div>
              </div>
            </div>

            {/* Intraday Signal Indicator */}
            {forecast && (
              <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Внутридневной прогноз:</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div
                      className={`text-xs font-bold flex items-center gap-1 ${
                        forecast.signal === 'BULLISH'
                          ? 'text-emerald-400'
                          : forecast.signal === 'BEARISH'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {forecast.signal === 'BULLISH' && <TrendingUp className="w-3.5 h-3.5" />}
                      {forecast.signal === 'BEARISH' && <TrendingDown className="w-3.5 h-3.5" />}
                      {forecast.signal === 'NEUTRAL' && <Minus className="w-3.5 h-3.5" />}
                      <span>{forecast.signalRussian}</span>
                    </div>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-300">
                      Цель: <strong className="text-white">${forecast.targetPrice.toFixed(3)}</strong>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[11px] text-slate-400">{forecast.confidencePercent}% увер.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Provenance & Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenProvenance}
                title="Источники данных и метки времени"
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded border border-slate-800 transition-colors flex items-center gap-1 text-xs font-mono"
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Метки времени</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Обновить котировки и прогнозы"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-slate-800 transition-colors flex items-center gap-1 text-xs font-mono disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Обновить</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
