export interface FutureInstrument {
  figi: string;
  ticker: string;
  uid: string;
  name: string;
  expirationDate: string;
  minPriceIncrement: number;
  lot: number;
  currency: string;
  classCode: string;
}

export interface FuturePrice {
  ticker: string;
  figi: string;
  uid: string;
  name: string;
  price: number;
  time: string;
  lastPriceType: string;
  expirationDate: string;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeBuy: number;
  volumeSell: number;
  isComplete: boolean;
}

export interface DayWeather {
  date: string;
  dayOffset: number;
  gfs: {
    mean: number;
    min: number;
    max: number;
    hdd: number;
    cdd: number;
    anomaly: number;
  };
  ecmwf: {
    mean: number;
    min: number;
    max: number;
    hdd: number;
    cdd: number;
    anomaly: number;
  };
  diffEcmwfMinusGfs: number;
  diffHdd: number;
  burnImpactBcfd: number;
}

export interface WeatherRegion {
  region: string;
  regionId: string;
  coordinates: { lat: number; lon: number };
  normalMeanF: number;
  outlook2to4Days: {
    gfsAvgTempF: number;
    ecmwfAvgTempF: number;
    modelSpreadTempF: number;
    gfsTotalHdd: number;
    ecmwfTotalHdd: number;
    hddModelDelta: number;
    trend: string;
  };
  daily: DayWeather[];
}

export interface WeatherData {
  regions: WeatherRegion[];
  meta: {
    gfsRun: string;
    gfsRunTime: string;
    ecmwfRun: string;
    ecmwfRunTime: string;
    updatedAt: string;
    coverage: string;
    source: string;
  };
}

export interface StorageHistoryItem {
  period: string;
  workingStorageBcf: number;
  netChangeBcf: number;
  action: string;
  seriesDescription: string;
}

export interface StorageRegion {
  name: string;
  storageBcf: number;
  sharePercent: number;
  withdrawalRisk: string;
}

export interface StorageData {
  summary: {
    latestPeriod: string;
    workingStorageBcf: number;
    netChangeBcf: number;
    priorWeekStorageBcf: number;
    fiveYearAverageBcf: number;
    surplusVsFiveYearBcf: number;
    surplusPercent: number;
    inventoryStatus: string;
    marketImpact: string;
  };
  regions: StorageRegion[];
  history: StorageHistoryItem[];
  meta: {
    reportName: string;
    dataEffectivePeriod: string;
    releaseTimestamp: string;
    lastUpdatedInApp: string;
    source: string;
  };
}

export interface BasinProduction {
  name: string;
  bcfd: number;
  share: string;
  trend: string;
}

export interface ProductionData {
  dryGasDailyBcfd: number;
  monthlyVolumeMmcf: number;
  reportingPeriod: string;
  estimatedCurrentDailyBcfd: number;
  canadianImportsBcfd: number;
  totalUSSupplyBcfd: number;
  basins: BasinProduction[];
  meta: {
    reportName: string;
    effectivePeriod: string;
    lastUpdatedInApp: string;
    source: string;
  };
}

export interface LngTerminal {
  name: string;
  operator: string;
  capacityBcfd: number;
  currentNominationBcfd: number;
  utilizationPercent: number;
  status: string;
  location: string;
}

export interface LngDestination {
  region: string;
  sharePercent: number;
  cargoCountMonth: number;
  priceBenchmark: string;
}

export interface LngData {
  feedgas: {
    totalFeedgasBcfd: number;
    totalCapacityBcfd: number;
    averageUtilization: number;
    dayOverDayDeltaBcfd: number;
    cycle: string;
    terminals: LngTerminal[];
  };
  doeReport: {
    period: string;
    totalExportVolumeMmcf: number;
    dailyAverageEquivalentBcfd: number;
    destinations: LngDestination[];
    source: string;
    reportTitle: string;
  };
  meta: {
    feedgasCycleTimestamp: string;
    doeReportPeriod: string;
    lastUpdatedInApp: string;
    feedgasSource: string;
    doeSource: string;
  };
}

export interface ForecastFactor {
  name: string;
  weightPercent: number;
  score: number;
  status: string;
  detail: string;
}

export interface TradeParameters {
  action: 'BUY' | 'SELL' | 'WAIT';
  actionRussian: string;
  entryPrice: number;
  entryRange: {
    low: number;
    high: number;
  };
  entryCondition: string;
  takeProfit: number;
  takeProfit2: number;
  takeProfitDelta: number;
  takeProfitPercent: number;
  stopLoss: number;
  stopLossDelta: number;
  stopLossPercent: number;
  stopLossTicks: number;
  riskRewardRatio: number;
  exitHorizon: string;
  exitCondition: string;
  trailingStopRule: string;
  riskManagementNote: string;
}

export interface TechnicalMetrics {
  atr14: number;
  rsi14: number;
  volumeDeltaPercent: number;
  buyerAdvantagePercent: number;
  sellerAdvantagePercent: number;
  vwap: number;
  trendRegime: 'TRENDING_UP' | 'TRENDING_DOWN' | 'CONSOLIDATION';
  trendRegimeRussian: string;
  ema9: number;
  ema21: number;
}

export interface HorizonForecast {
  horizon: 'INTRADAY' | 'MULTI_DAY';
  horizonLabel: string;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signalRussian: string;
  color: string;
  compositeScore: number;
  confidencePercent: number;
  targetPrice: number;
  targetRange: {
    low: number;
    high: number;
  };
  tradePlan: TradeParameters;
  factors: ForecastFactor[];
  keyCatalysts: string[];
}

export interface IntradayForecast {
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signalRussian: string;
  color: string;
  compositeScore: number;
  confidencePercent: number;
  currentPrice: number;
  frontContract: string;
  contractName?: string;
  contractExpiration?: string | null;
  targetPrice: number;
  targetRange: {
    low: number;
    high: number;
  };
  tradePlan: TradeParameters;
  keyCatalysts: string[];
  factors: ForecastFactor[];
  technicals?: TechnicalMetrics;
  horizons?: {
    intraday: HorizonForecast;
    multiDay: HorizonForecast;
  };
  scenarioInputs: {
    customTempShiftF: number;
    customFeedgasShiftBcfd: number;
    customStorageSurplusShiftBcf: number;
  };
  generatedAt: string;
  timestamps: {
    priceTimestamp: string;
    weatherTimestamp: string;
    eiaStorageTimestamp: string;
    eiaProductionTimestamp: string;
    lngNominationsTimestamp: string;
  };
}

export interface ConsumptionPoint {
  monthName: string;
  monthIndex: number;
  actual2026Bcfd?: number | null;
  year2025Bcfd: number;
  year2024Bcfd: number;
  year2023Bcfd: number;
  fiveYearAvgBcfd: number;
  normMinBcfd: number;
  normMaxBcfd: number;
  deviationFromNormBcfd?: number | null;
  deviationPercent?: number | null;
}

export interface SectorConsumption {
  sector: string;
  sharePercent: number;
  currentBcfd: number;
  trend: string;
}

export interface ConsumptionData {
  currentMonth: {
    period: string;
    monthName: string;
    currentEstimatedBcfd: number;
    year2025Bcfd: number;
    year2024Bcfd: number;
    year2023Bcfd: number;
    fiveYearAvgBcfd: number;
    deviationFromNormBcfd: number;
    deviationPercent: number;
    demandStatus: string;
    marketImpact: string;
  };
  monthlyCurve: ConsumptionPoint[];
  sectors: SectorConsumption[];
  meta: {
    reportName: string;
    source: string;
    dataEffectivePeriod: string;
    lastUpdatedInApp: string;
  };
}

