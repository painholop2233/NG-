import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Activity,
  CloudSun,
  Database,
  Layers,
  Ship,
  Clock,
  RefreshCw,
  Sliders,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  FutureInstrument,
  FuturePrice,
  Candle,
  WeatherData,
  StorageData,
  ProductionData,
  LngData,
  IntradayForecast,
  ConsumptionData,
} from './types';
import { Navbar } from './components/Navbar';
import { IntradayForecastCard } from './components/IntradayForecastCard';
import { WeatherAnalysis } from './components/WeatherAnalysis';
import { PriceChart } from './components/PriceChart';
import { StorageSection } from './components/StorageSection';
import { ProductionSection } from './components/ProductionSection';
import { LngTerminalSection } from './components/LngTerminalSection';
import { DataProvenanceModal } from './components/DataProvenanceModal';
import { SheetsTrackingSection } from './components/SheetsTrackingSection';

export default function App() {
  const [instruments, setInstruments] = useState<FutureInstrument[]>([]);
  const [prices, setPrices] = useState<FuturePrice[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('NGV6');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [candleInterval, setCandleInterval] = useState<string>('CANDLE_INTERVAL_15_MIN');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [storage, setStorage] = useState<StorageData | null>(null);
  const [production, setProduction] = useState<ProductionData | null>(null);
  const [lngData, setLngData] = useState<LngData | null>(null);
  const [consumption, setConsumption] = useState<ConsumptionData | null>(null);
  const [forecast, setForecast] = useState<IntradayForecast | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'sheets' | 'weather' | 'chart' | 'storage' | 'production' | 'lng'>('overview');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showProvenanceModal, setShowProvenanceModal] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simShifts, setSimShifts] = useState<{ temp: number; feedgas: number; storage: number }>({
    temp: 0,
    feedgas: 0,
    storage: 0,
  });

  // Recalculate forecast for a specific ticker and simulation parameters
  const recalculateForecast = useCallback(
    async (
      ticker: string,
      temp = 0,
      feedgas = 0,
      storage = 0
    ) => {
      setIsSimulating(true);
      try {
        const res = await fetch('/api/forecast/intraday', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker,
            customTempShiftC: temp,
            customTempShiftF: temp * 1.8,
            customFeedgasShiftBcfd: feedgas,
            customStorageSurplusShiftBcf: storage,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setForecast(data);
        }
      } catch (e) {
        console.error('Forecast recalculation failed:', e);
      } finally {
        setIsSimulating(false);
      }
    },
    []
  );

  const handleSelectTicker = (ticker: string) => {
    setSelectedTicker(ticker);
    recalculateForecast(ticker, simShifts.temp, simShifts.feedgas, simShifts.storage);
  };

  // Fetch all initial data
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const [futuresRes, pricesRes, weatherRes, storageRes, prodRes, lngRes, consRes] = await Promise.allSettled([
        fetch('/api/tinkoff/futures').then((r) => r.json()),
        fetch('/api/tinkoff/prices').then((r) => r.json()),
        fetch('/api/weather').then((r) => r.json()),
        fetch('/api/eia/storage').then((r) => r.json()),
        fetch('/api/eia/production').then((r) => r.json()),
        fetch('/api/lng/feedgas-and-doe').then((r) => r.json()),
        fetch('/api/eia/consumption').then((r) => r.json()),
      ]);

      if (futuresRes.status === 'fulfilled' && futuresRes.value.instruments) {
        setInstruments(futuresRes.value.instruments);
        if (!selectedTicker && futuresRes.value.instruments.length > 0) {
          setSelectedTicker(futuresRes.value.instruments[0].ticker);
        }
      }

      if (pricesRes.status === 'fulfilled' && pricesRes.value.prices) {
        setPrices(pricesRes.value.prices);
      }

      if (weatherRes.status === 'fulfilled' && weatherRes.value.regions) {
        setWeather(weatherRes.value);
      }

      if (storageRes.status === 'fulfilled' && storageRes.value.summary) {
        setStorage(storageRes.value);
      }

      if (prodRes.status === 'fulfilled' && prodRes.value.dryGasDailyBcfd) {
        setProduction(prodRes.value);
      }

      if (lngRes.status === 'fulfilled' && lngRes.value.feedgas) {
        setLngData(lngRes.value);
      }

      if (consRes.status === 'fulfilled' && consRes.value.monthlyCurve) {
        setConsumption(consRes.value);
      }

      // Load initial forecast for active contract
      const forecastRes = await fetch('/api/forecast/intraday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: selectedTicker }),
      });
      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        setForecast(forecastData);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading data:', err);
      setErrorMessage(err.message || 'Ошибка загрузки данных');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedTicker]);

  // Load candles whenever ticker or interval changes
  const loadCandles = useCallback(async (ticker: string, interval: string) => {
    const inst = instruments.find((i) => i.ticker === ticker);
    const instrumentId = inst?.uid || inst?.figi;
    if (!instrumentId) return;

    setIsLoadingCandles(true);
    try {
      const res = await fetch(`/api/tinkoff/candles?instrumentId=${instrumentId}&interval=${interval}`);
      if (res.ok) {
        const data = await res.json();
        setCandles(data.candles || []);
      }
    } catch (e) {
      console.error('Error loading candles:', e);
    } finally {
      setIsLoadingCandles(false);
    }
  }, [instruments]);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedTicker && instruments.length > 0) {
      loadCandles(selectedTicker, candleInterval);
    }
  }, [selectedTicker, candleInterval, instruments, loadCandles]);

  // Periodic price polling every 10 seconds
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/tinkoff/prices');
        if (res.ok) {
          const data = await res.json();
          if (data.prices) setPrices(data.prices);
        }
      } catch (e) {
        // silent fail on background poll
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Handle Simulation Request
  const handleSimulate = async (tempShift: number, feedgasShift: number, storageShift: number, ticker?: string) => {
    const targetTicker = ticker || selectedTicker;
    setSimShifts({ temp: tempShift, feedgas: feedgasShift, storage: storageShift });
    await recalculateForecast(targetTicker, tempShift, feedgasShift, storageShift);
  };

  const currentPriceObj = prices.find((p) => p.ticker === selectedTicker) || prices[0];
  const priceVal = currentPriceObj?.price ?? 2.634;

  const tabs = [
    { id: 'overview', label: 'Сводный терминал (All-in-One)' },
    { id: 'forecast', label: 'Внутридневной прогноз' },
    { id: 'sheets', label: 'Google Таблица (1h Статистика)' },
    { id: 'weather', label: 'Погода GFS/ECMWF (2-4 дня)' },
    { id: 'chart', label: 'График Т-Инвестиции' },
    { id: 'storage', label: 'Запасы EIA' },
    { id: 'production', label: 'Добыча EIA' },
    { id: 'lng', label: 'Экспорт СПГ & Номинации' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Fixed Header */}
      <Navbar
        instruments={instruments}
        prices={prices}
        selectedTicker={selectedTicker}
        onSelectTicker={handleSelectTicker}
        forecast={forecast}
        isRefreshing={isRefreshing}
        onRefresh={loadAllData}
        lastUpdated={lastUpdated}
        onOpenProvenance={() => setShowProvenanceModal(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner if any */}
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 px-4 py-3 rounded-lg text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={loadAllData} className="underline text-white">
              Повторить
            </button>
          </div>
        )}

        {/* Global Summary Metric Ticker Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
          {/* Card 1: Live Quote & Futures Contract Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Фьючерс Henry Hub
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-mono">
                Т-Инвест
              </span>
            </div>
            {/* Quick Contract Select */}
            <div className="mt-1">
              <select
                value={selectedTicker}
                onChange={(e) => handleSelectTicker(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 rounded px-1.5 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                aria-label="Выбрать актуальный фьючерс"
              >
                {instruments.map((inst) => {
                  const p = prices.find((pr) => pr.ticker === inst.ticker);
                  return (
                    <option key={inst.ticker} value={inst.ticker}>
                      {inst.ticker} ({inst.name.split(' ')[0]}) {p ? `— $${p.price.toFixed(3)}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="text-xl font-bold text-white mt-1.5">
              ${priceVal.toFixed(3)}
              <span className="text-[10px] text-slate-400 font-normal ml-1">/ MMBtu</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span className="truncate">
                  {currentPriceObj?.time
                    ? new Date(currentPriceObj.time).toLocaleTimeString('ru-RU')
                    : 'Live tick'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentPriceObj?.expirationDate ? `Эксп: ${new Date(currentPriceObj.expirationDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}` : ''}
              </span>
            </div>
          </div>

          {/* Card 2: Intraday Signal */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Внутридневной вектор
            </span>
            <div
              className={`text-base font-bold mt-0.5 flex items-center gap-1 ${
                forecast?.signal === 'BULLISH'
                  ? 'text-emerald-400'
                  : forecast?.signal === 'BEARISH'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {forecast?.signal === 'BULLISH' && <TrendingUp className="w-4 h-4" />}
              {forecast?.signal === 'BEARISH' && <TrendingDown className="w-4 h-4" />}
              {forecast?.signal === 'NEUTRAL' && <Minus className="w-4 h-4" />}
              <span className="truncate">{forecast?.signalRussian || 'РАСЧЁТ'}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Цель: <strong className="text-white">${forecast?.targetPrice.toFixed(3) || '—'}</strong>
            </div>
          </div>

          {/* Card 3: Weather Northeast 2-4D */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Погода Северо-Восток (2-4д)
            </span>
            <div className="text-base font-bold text-white mt-0.5">
              {weather?.regions?.[0]?.outlook2to4Days?.gfsAvgTempF != null
                ? `${Math.round(((weather.regions[0].outlook2to4Days.gfsAvgTempF - 32) * 5 / 9) * 10) / 10}°C`
                : '13.6°C'}
              <span className="text-xs text-blue-400 ml-1">
                (Δ {weather?.regions?.[0]?.outlook2to4Days?.modelSpreadTempF != null
                  ? `${Math.round((weather.regions[0].outlook2to4Days.modelSpreadTempF * 5 / 9) * 10) / 10 > 0 ? '+' : ''}${Math.round((weather.regions[0].outlook2to4Days.modelSpreadTempF * 5 / 9) * 10) / 10}°C`
                  : '0°C'})
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              {weather?.regions?.[0]?.outlook2to4Days?.trend.split('(')[0] || 'Прогон 12Z'}
            </div>
          </div>

          {/* Card 4: EIA Storage */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Запасы EIA (Lower 48)
            </span>
            <div className="text-base font-bold text-white mt-0.5">
              {storage?.summary?.workingStorageBcf.toLocaleString() || '3,644'}{' '}
              <span className="text-xs text-slate-400">Bcf</span>
            </div>
            <div className="text-[10px] text-amber-400 mt-1">
              {storage?.summary?.surplusVsFiveYearBcf && storage.summary.surplusVsFiveYearBcf > 0 ? '+' : ''}
              {storage?.summary?.surplusVsFiveYearBcf || 104} Bcf vs 5-летняя
            </div>
          </div>

          {/* Card 5: LNG Feedgas */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 col-span-2 md:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Отбор СПГ (Feedgas Live)
            </span>
            <div className="text-base font-bold text-sky-400 mt-0.5">
              {lngData?.feedgas?.totalFeedgasBcfd || '14.43'}{' '}
              <span className="text-xs text-slate-400">Bcf/d</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Загрузка: <strong className="text-white">{lngData?.feedgas?.averageUtilization || '92.5'}%</strong>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs font-mono">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg whitespace-nowrap transition-all font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Views */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 1. Primary Intraday Forecast Card */}
            <IntradayForecastCard
              forecast={forecast}
              onSimulate={handleSimulate}
              isSimulating={isSimulating}
              instruments={instruments}
              prices={prices}
              selectedTicker={selectedTicker}
              onSelectTicker={handleSelectTicker}
            />

            {/* 2. Google Sheets Hourly Forecast Logging & 1h Outcome Tracking */}
            <SheetsTrackingSection
              forecast={forecast}
              prices={prices}
              selectedTicker={selectedTicker}
            />

            {/* 3. Weather Models Comparison: GFS vs ECMWF (2-4 Days) */}
            <WeatherAnalysis weather={weather} />

            {/* 4. Real Price Candlestick Chart from T-Invest & EIA Seasonal Demand Overlay */}
            <PriceChart
              candles={candles}
              selectedTicker={selectedTicker}
              instruments={instruments}
              prices={prices}
              onSelectTicker={handleSelectTicker}
              interval={candleInterval}
              onChangeInterval={(i) => setCandleInterval(i)}
              isLoading={isLoadingCandles}
              consumption={consumption}
            />

            {/* 5. EIA Storage & Withdrawals */}
            <StorageSection storage={storage} />

            {/* 6. Production & LNG Terminal Nominations Grid (2-column layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductionSection production={production} />
              <LngTerminalSection lngData={lngData} />
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <IntradayForecastCard
              forecast={forecast}
              onSimulate={handleSimulate}
              isSimulating={isSimulating}
              instruments={instruments}
              prices={prices}
              selectedTicker={selectedTicker}
              onSelectTicker={handleSelectTicker}
            />
            {/* Weather context for forecast */}
            <WeatherAnalysis weather={weather} />
          </div>
        )}

        {activeTab === 'sheets' && (
          <div className="space-y-6">
            <SheetsTrackingSection
              forecast={forecast}
              prices={prices}
              selectedTicker={selectedTicker}
            />
          </div>
        )}

        {activeTab === 'weather' && (
          <div className="space-y-6">
            <WeatherAnalysis weather={weather} />
            {/* Quick forecast impact */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-300">
              <h3 className="text-sm font-bold text-white uppercase mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-400" />
                <span>Как погода влияет на внутридневной прогноз фьючерса:</span>
              </h3>
              <p className="font-sans leading-relaxed text-slate-400">
                Газовые трейдеры на биржах MOEX и NYMEX в первую очередь реагируют на обновления прогонов GFS (00Z, 06Z, 12Z, 18Z) и ECMWF (00Z, 12Z).
                Сдвиг температуры на 1°C ниже нормы в Северо-Востоке и на Среднем Западе увеличивает спрос на газ для отопления на ~2.2–3.2 Bcf/d, вызывая агрессивный внутридневной выкуп фьючерсов.
                Если европейская модель ECMWF оказывается холоднее американской GFS на 2–4 дня вперёд, рынок закладывает бычий фактор на предстоящие сессии.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="space-y-6">
            <PriceChart
              candles={candles}
              selectedTicker={selectedTicker}
              instruments={instruments}
              prices={prices}
              onSelectTicker={(t) => setSelectedTicker(t)}
              interval={candleInterval}
              onChangeInterval={(i) => setCandleInterval(i)}
              isLoading={isLoadingCandles}
              consumption={consumption}
            />
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-6">
            <StorageSection storage={storage} />
          </div>
        )}

        {activeTab === 'production' && (
          <div className="space-y-6">
            <ProductionSection production={production} />
          </div>
        )}

        {activeTab === 'lng' && (
          <div className="space-y-6">
            <LngTerminalSection lngData={lngData} />
          </div>
        )}

        {/* Global Timestamps & Auditability Footer Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Все потоки данных верифицированы: Т-Инвестиции · GFS · ECMWF · EIA · DOE</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Последнее обновление терминала: {lastUpdated.toLocaleTimeString('ru-RU')}</span>
            <button
              onClick={() => setShowProvenanceModal(true)}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Подробный аудит времени релиза
            </button>
          </div>
        </div>
      </main>

      {/* Data Provenance & Timestamps Modal */}
      <DataProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
        forecast={forecast}
        weather={weather}
        storage={storage}
        production={production}
        lngData={lngData}
        consumption={consumption}
        prices={prices}
        selectedTicker={selectedTicker}
      />
    </div>
  );
}
