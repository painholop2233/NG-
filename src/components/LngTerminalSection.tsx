import React from 'react';
import { Ship, Clock, Globe, Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { LngData } from '../types';

interface LngTerminalSectionProps {
  lngData: LngData | null;
}

export const LngTerminalSection: React.FC<LngTerminalSectionProps> = ({ lngData }) => {
  if (!lngData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const { feedgas, doeReport, meta } = lngData;

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-sky-950 border border-sky-800 text-sky-400">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Экспорт СПГ: Номинации сырьевого газа (Feedgas) и отчёты DOE
              </h2>
              <span className="text-xs text-sky-400 font-mono font-medium">
                [LIVE FEEDGAS & DOE/FE]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Оперативный отбор газа терминалами сжижения и структура мировых поставок Минэнерго США (DOE)
            </p>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Номинации: {meta.feedgasCycleTimestamp}</span>
        </div>
      </div>

      <div className="p-6 space-y-6 font-mono">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Текущий отбор СПГ (Feedgas):</span>
            <div className="text-2xl font-black text-white mt-1">
              {feedgas.totalFeedgasBcfd}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf/d</span>
            </div>
            <div className="text-xs text-emerald-400 mt-2">
              +{feedgas.dayOverDayDeltaBcfd} Bcf/d за сутки
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Загрузка экспортных мощностей:</span>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {feedgas.averageUtilization}%
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Макс. мощность: {feedgas.totalCapacityBcfd} Bcf/d
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Экспортный объём по DOE:</span>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {doeReport.dailyAverageEquivalentBcfd}{' '}
              <span className="text-xs text-slate-400 font-normal">Bcf/d эквивалент</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Отчётный месяц: {doeReport.period}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <span className="text-xs text-slate-400 block uppercase">Текущий цикл номинаций:</span>
            <div className="text-sm font-bold text-slate-200 mt-1.5">
              {feedgas.cycle}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Электронные доски EBB газопроводов
            </div>
          </div>
        </div>

        {/* Real-time LNG Terminal Nominations Grid */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Номинации сырьевого газа по терминалам СПГ США (Real-time Pipeline Feedgas)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Поставки газа на заводы сжижения через магистральные газопроводы (Kinder Morgan, Cheniere Creole Trail, NGPL, Transco)
              </p>
            </div>
            <span className="text-xs text-slate-500">{feedgas.terminals.length} терминалов</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {feedgas.terminals.map((term, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{term.name}</h4>
                    <span className="text-[10px] text-slate-500 block">{term.operator}</span>
                  </div>
                  <span className="text-xs font-bold text-sky-400">{term.currentNominationBcfd} Bcf/d</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Загрузка:</span>
                    <strong className="text-slate-200">{term.utilizationPercent}%</strong>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, term.utilizationPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Ёмкость: {term.capacityBcfd} Bcf/d</span>
                  <span className="text-emerald-400 truncate max-w-[110px]" title={term.status}>
                    {term.status.split('(')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DOE Destinations Breakdown */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                География экспорта СПГ США (Отчёт DOE/FE Office of Fossil Energy)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Распределение танкерных партий СПГ и региональные ценовые бенчмарки
              </p>
            </div>
            <span className="text-xs text-slate-400">{doeReport.reportTitle}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {doeReport.destinations.map((dest, i) => (
              <div key={i} className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white font-bold">{dest.region}</span>
                  <span className="text-purple-400 font-bold">{dest.sharePercent}%</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                  <span>Танкерных партий/мес:</span>
                  <strong className="text-slate-200">{dest.cargoCountMonth} танкеров</strong>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>Ценовой спред:</span>
                  <span className="text-amber-400 font-medium">{dest.priceBenchmark}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
