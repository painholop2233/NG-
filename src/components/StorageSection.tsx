import React from 'react';
import { Database, Clock, TrendingUp, TrendingDown, ArrowDownUp, AlertCircle, ShieldCheck } from 'lucide-react';
import { StorageData } from '../types';

interface StorageSectionProps {
  storage: StorageData | null;
}

export const StorageSection: React.FC<StorageSectionProps> = ({ storage }) => {
  if (!storage) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const { summary, regions, history, meta } = storage;
  const isSurplus = summary.surplusVsFiveYearBcf > 0;

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-purple-950 border border-purple-800 text-purple-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Запасы газа в хранилищах США (EIA Storage)
              </h2>
              <span className="text-xs text-purple-400 font-mono font-medium">
                [EIA WNGSR]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Объём активного газа в ПХГ Lower 48, темпы отбора/закачки и отклонение от 5-летней средней
            </p>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>{meta.dataEffectivePeriod}</span>
          <span className="text-slate-600">·</span>
          <span>Релиз: {meta.releaseTimestamp}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* Total Working Gas */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Активный объём в ПХГ:</span>
            <div className="text-2xl font-black text-white mt-1">
              {summary.workingStorageBcf.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf</span>
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Lower 48 States</span>
              <span className="text-purple-400">100% ёмкости</span>
            </div>
          </div>

          {/* Weekly Net Change */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Недельное изменение:</span>
            <div
              className={`text-2xl font-black mt-1 flex items-center gap-1 ${
                summary.netChangeBcf >= 0 ? 'text-blue-400' : 'text-orange-400'
              }`}
            >
              {summary.netChangeBcf >= 0 ? `+${summary.netChangeBcf}` : summary.netChangeBcf}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {summary.netChangeBcf >= 0 ? 'Закачка перед зимой' : 'Сезонный отбор (Withdrawal)'}
            </div>
          </div>

          {/* 5-Year Average Surplus/Deficit */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">vs 5-летняя средняя:</span>
            <div
              className={`text-2xl font-black mt-1 ${
                isSurplus ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isSurplus ? `+${summary.surplusVsFiveYearBcf}` : summary.surplusVsFiveYearBcf}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf ({summary.surplusPercent}%)</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              База 5 лет: {summary.fiveYearAverageBcf.toLocaleString()} Bcf
            </div>
          </div>

          {/* Market Balance Impact */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Рыночный баланс:</span>
            <div className="text-sm font-bold text-slate-200 mt-1.5 leading-snug">
              {summary.inventoryStatus}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Влияние: {summary.marketImpact}
            </div>
          </div>
        </div>

        {/* Regional Breakdown & History (2 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
          {/* Regional Table (6 Cols) */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center justify-between">
              <span>Региональная структура ПХГ (EIA Regional Storage)</span>
              <span className="text-[10px] text-slate-500">6 регионов</span>
            </h3>

            <div className="space-y-2.5">
              {regions.map((reg, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-200 font-medium">{reg.name}</span>
                    <span className="text-white font-bold">{reg.storageBcf} Bcf</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Доля: {reg.sharePercent}%</span>
                    <span className="text-purple-300">{reg.withdrawalRisk}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical 10-Week Trajectory (6 Cols) */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center justify-between">
              <span>История последних отчётов EIA (Недельный темп)</span>
              <span className="text-[10px] text-slate-500">Bcf / неделя</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-2.5">Отчётная дата</th>
                    <th className="py-2 px-2.5">Запасы (Bcf)</th>
                    <th className="py-2 px-2.5">Изменение</th>
                    <th className="py-2 px-2.5">Операция</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-900/40">
                      <td className="py-2 px-2.5 whitespace-nowrap text-slate-300">{h.period}</td>
                      <td className="py-2 px-2.5 font-bold text-white whitespace-nowrap">
                        {h.workingStorageBcf.toLocaleString()}
                      </td>
                      <td
                        className={`py-2 px-2.5 font-bold whitespace-nowrap ${
                          h.netChangeBcf >= 0 ? 'text-blue-400' : 'text-orange-400'
                        }`}
                      >
                        {h.netChangeBcf > 0 ? `+${h.netChangeBcf}` : h.netChangeBcf}
                      </td>
                      <td className="py-2 px-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                        {h.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
