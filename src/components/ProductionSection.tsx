import React from 'react';
import { Layers, Clock, Flame, ShieldAlert, TrendingUp } from 'lucide-react';
import { ProductionData } from '../types';

interface ProductionSectionProps {
  production: ProductionData | null;
}

export const ProductionSection: React.FC<ProductionSectionProps> = ({ production }) => {
  if (!production) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const {
    dryGasDailyBcfd,
    monthlyVolumeMmcf,
    reportingPeriod,
    estimatedCurrentDailyBcfd,
    canadianImportsBcfd,
    totalUSSupplyBcfd,
    basins,
    meta,
  } = production;

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Добыча природного газа в США (EIA US Dry Gas Production)
              </h2>
              <span className="text-xs text-emerald-400 font-mono font-medium">
                [EIA Supply Engine]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Суточная добыча товарного сухого газа, канадский импорт и динамика ключевых бассейнов
            </p>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{meta.effectivePeriod}</span>
        </div>
      </div>

      <div className="p-6 space-y-6 font-mono">
        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Сухая добыча США (Run-Rate):</span>
            <div className="text-2xl font-black text-white mt-1">
              {estimatedCurrentDailyBcfd}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf/d</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Месячный объём EIA: {(monthlyVolumeMmcf / 1000).toLocaleString()} Bcf
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Канадский чистый импорт:</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              +{canadianImportsBcfd}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf/d</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Пайплайны через Midwest и Pacific Northwest
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Совокупное предложение:</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {totalUSSupplyBcfd}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf/d</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Общее суточное поступление газа в систему США
            </div>
          </div>
        </div>

        {/* Basin Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Структура добычи по сланцевым бассейнам (US Shale Basins)
            </span>
            <span className="text-xs text-slate-400">Источник: EIA Drilling Productivity & Monthly</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Газоносный бассейн (Basin)</th>
                  <th className="py-2.5 px-3">Добыча (Bcf/d)</th>
                  <th className="py-2.5 px-3">Доля рынка</th>
                  <th className="py-2.5 px-3">Статус и газопроводы (Takeaway)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {basins.map((basin, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-white">
                      {basin.name}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-bold text-emerald-400">
                      {basin.bcfd} Bcf/d
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                      {basin.share}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {basin.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
