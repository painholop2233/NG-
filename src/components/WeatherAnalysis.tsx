import React, { useState } from 'react';
import { CloudSun, Wind, Thermometer, Clock, ArrowRight, TrendingUp, TrendingDown, Info, Flame } from 'lucide-react';
import { WeatherData } from '../types';

const toC = (f: number): number => Math.round(((f - 32) * 5 / 9) * 10) / 10;
const deltaToC = (df: number): number => Math.round((df * 5 / 9) * 10) / 10;

interface WeatherAnalysisProps {
  weather: WeatherData | null;
}

export const WeatherAnalysis: React.FC<WeatherAnalysisProps> = ({ weather }) => {
  const [selectedRegionId, setSelectedRegionId] = useState<'northeast' | 'central'>('northeast');

  if (!weather || !weather.regions || weather.regions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="h-48 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const currentRegion =
    weather.regions.find((r) => r.regionId === selectedRegionId) || weather.regions[0];
  const outlook = currentRegion.outlook2to4Days;

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Погодные модели: GFS (США) vs ECMWF (Европа)
              </h2>
              <span className="text-xs text-cyan-400 font-mono font-medium">
                [Фокус: 2–4 ДНЯ ВПЕРЁД]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Сравнение температурных прогонов, аномалий и расчёта градусов отопительного периода (HDD)
            </p>
          </div>
        </div>

        {/* Region Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setSelectedRegionId('northeast')}
            className={`px-3 py-1.5 rounded transition-colors ${
              selectedRegionId === 'northeast'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Северо-Восток США (NY-PA / PJM)
          </button>
          <button
            onClick={() => setSelectedRegionId('central')}
            className={`px-3 py-1.5 rounded transition-colors ${
              selectedRegionId === 'central'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Центральная часть США (Midwest / Chicago)
          </button>
        </div>
      </div>

      {/* Model Run Provenance Bar */}
      <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-slate-300 font-medium">GFS 0.25°:</span>
            <span>Прогон {new Date(weather.meta.gfsRunTime).toLocaleDateString('ru-RU')} 12Z</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="text-slate-300 font-medium">ECMWF IFS:</span>
            <span>Прогон {new Date(weather.meta.ecmwfRunTime).toLocaleDateString('ru-RU')} 00/12Z</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">База расчёта HDD: 18.3°C</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Синхронизировано: {new Date(weather.meta.updatedAt).toLocaleTimeString('ru-RU')}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 2-4 Day Lookahead Focus Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* GFS 2-4 Day Avg */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>GFS Средняя (дни 2-4)</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 text-[10px] border border-blue-800">
                NOAA NCEP
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {toC(outlook.gfsAvgTempF)}°C
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Сумма HDD: {outlook.gfsTotalHdd}</span>
              <span
                className={`font-semibold ${
                  outlook.gfsAvgTempF < currentRegion.normalMeanF ? 'text-blue-400' : 'text-amber-400'
                }`}
              >
                {outlook.gfsAvgTempF < currentRegion.normalMeanF ? 'Холоднее нормы' : 'Теплее нормы'}
              </span>
            </div>
          </div>

          {/* ECMWF 2-4 Day Avg */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>ECMWF Средняя (дни 2-4)</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 text-[10px] border border-indigo-800">
                IFS Europe
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {toC(outlook.ecmwfAvgTempF)}°C
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Сумма HDD: {outlook.ecmwfTotalHdd}</span>
              <span
                className={`font-semibold ${
                  outlook.ecmwfAvgTempF < currentRegion.normalMeanF ? 'text-blue-400' : 'text-amber-400'
                }`}
              >
                {outlook.ecmwfAvgTempF < currentRegion.normalMeanF ? 'Холоднее нормы' : 'Теплее нормы'}
              </span>
            </div>
          </div>

          {/* Model Spread / Delta */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Расхождение (ECMWF - GFS)</span>
              <Thermometer className="w-4 h-4 text-slate-400" />
            </div>
            <div
              className={`text-2xl font-black mt-1 ${
                outlook.modelSpreadTempF > 0 ? 'text-amber-400' : 'text-blue-400'
              }`}
            >
              {deltaToC(outlook.modelSpreadTempF) > 0 ? '+' : ''}
              {deltaToC(outlook.modelSpreadTempF)}°C
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {outlook.modelSpreadTempF < 0 ? (
                <span className="text-blue-300 font-medium">ECMWF холоднее GFS (бычий перевес)</span>
              ) : outlook.modelSpreadTempF > 0 ? (
                <span className="text-amber-300 font-medium">ECMWF теплее GFS (сдержанный спрос)</span>
              ) : (
                <span className="text-slate-300">Модели согласованы</span>
              )}
            </div>
          </div>

          {/* Gas Burn Impact */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Влияние на расход газа</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {outlook.trend.includes('Холоднее') ? '+0.45' : '-0.38'}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf/d</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Отопительный отбор в регионе: {outlook.trend.includes('Холоднее') ? 'Повышенный' : 'Пониженный'}
            </div>
          </div>
        </div>

        {/* Detailed Day-by-Day Forecast Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Сравнительная таблица прогонов по дням ({currentRegion.region})
              </span>
            </div>
            <span className="text-xs text-slate-400">Норма региона: {toC(currentRegion.normalMeanF)}°C</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Дата / Горизонт</th>
                  <th className="py-2.5 px-3">GFS Тмин/Тмакс (°C)</th>
                  <th className="py-2.5 px-3">GFS Средняя (°C)</th>
                  <th className="py-2.5 px-3">ECMWF Тмин/Тмакс (°C)</th>
                  <th className="py-2.5 px-3">ECMWF Средняя (°C)</th>
                  <th className="py-2.5 px-3">Дельта темп. (°C)</th>
                  <th className="py-2.5 px-3">HDD (GFS / ECMWF)</th>
                  <th className="py-2.5 px-3">Расход газа (Bcf/d)</th>
                  <th className="py-2.5 px-3">Рыночный сигнал</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentRegion.daily.map((d, idx) => {
                  const is2to4 = d.dayOffset >= 2 && d.dayOffset <= 4;
                  return (
                    <tr
                      key={d.date}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        is2to4 ? 'bg-blue-950/20 font-medium' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {is2to4 && <span className="text-amber-400 font-bold">★</span>}
                          <span>{d.date}</span>
                          <span className="text-slate-500 text-[10px]">
                            {idx === 0 ? '(Сегодня)' : `(+${idx}д)`}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                        {toC(d.gfs.min)}°C / {toC(d.gfs.max)}°C
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">
                        {toC(d.gfs.mean)}°C
                        <span
                          className={`text-[10px] ml-1.5 ${
                            d.gfs.anomaly < 0 ? 'text-blue-400' : 'text-amber-400'
                          }`}
                        >
                          ({deltaToC(d.gfs.anomaly) > 0 ? '+' : ''}
                          {deltaToC(d.gfs.anomaly)}°C)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                        {toC(d.ecmwf.min)}°C / {toC(d.ecmwf.max)}°C
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">
                        {toC(d.ecmwf.mean)}°C
                        <span
                          className={`text-[10px] ml-1.5 ${
                            d.ecmwf.anomaly < 0 ? 'text-blue-400' : 'text-amber-400'
                          }`}
                        >
                          ({deltaToC(d.ecmwf.anomaly) > 0 ? '+' : ''}
                          {deltaToC(d.ecmwf.anomaly)}°C)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            d.diffEcmwfMinusGfs < 0
                              ? 'text-blue-400'
                              : d.diffEcmwfMinusGfs > 0
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {deltaToC(d.diffEcmwfMinusGfs) > 0 ? '+' : ''}
                          {deltaToC(d.diffEcmwfMinusGfs)}°C
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-blue-300">{d.gfs.hdd}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-indigo-300">{d.ecmwf.hdd}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                        <span className={d.burnImpactBcfd > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {d.burnImpactBcfd > 0 ? `+${d.burnImpactBcfd}` : d.burnImpactBcfd} Bcf/d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {d.gfs.anomaly < -2 || d.ecmwf.anomaly < -2 ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Бычий
                          </span>
                        ) : d.gfs.anomaly > 2 || d.ecmwf.anomaly > 2 ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5" /> Медвежий
                          </span>
                        ) : (
                          <span className="text-slate-400">Нейтральный</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
