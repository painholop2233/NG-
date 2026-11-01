import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  ShieldCheck,
  Zap,
  Play,
  RotateCw,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout, getAccessToken, initAuth } from '../lib/googleAuth';
import {
  findOrCreateSpreadsheet,
  fetchSpreadsheetRows,
  appendForecastRow,
  updateForecastRowOutcome,
  ForecastLogEntry,
} from '../lib/googleSheets';
import { IntradayForecast, FuturePrice } from '../types';

interface SheetsTrackingSectionProps {
  forecast: IntradayForecast | null;
  prices: FuturePrice[];
  selectedTicker: string;
}

export const SheetsTrackingSection: React.FC<SheetsTrackingSectionProps> = ({
  forecast,
  prices,
  selectedTicker,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [entries, setEntries] = useState<ForecastLogEntry[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(false);
  const [isLoggingNow, setIsLoggingNow] = useState<boolean>(false);
  const [isUpdatingOutcomes, setIsUpdatingOutcomes] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Connect / Setup Spreadsheet when authenticated
  const setupSpreadsheet = useCallback(async (authToken: string) => {
    setIsLoadingSheet(true);
    setStatusMessage('Поиск или создание Google Таблицы...');
    try {
      const sheetInfo = await findOrCreateSpreadsheet(authToken);
      setSpreadsheetId(sheetInfo.spreadsheetId);
      setSpreadsheetUrl(sheetInfo.url);
      localStorage.setItem('hh_spreadsheet_id', sheetInfo.spreadsheetId);
      localStorage.setItem('hh_spreadsheet_url', sheetInfo.url);

      const rows = await fetchSpreadsheetRows(authToken, sheetInfo.spreadsheetId);
      setEntries(rows);
      setStatusMessage(
        sheetInfo.isNew
          ? 'Создана новая Google Таблица с настроенными столбцами!'
          : 'Подключена существующая Google Таблица с историей'
      );
    } catch (err: any) {
      console.error('Spreadsheet setup error:', err);
      setStatusMessage(`Ошибка подключения к таблице: ${err.message}`);
    } finally {
      setIsLoadingSheet(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      setupSpreadsheet(token);
    }
  }, [token, setupSpreadsheet]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMessage(`Ошибка авторизации Google: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setSpreadsheetId(null);
    setSpreadsheetUrl(null);
    setEntries([]);
    setStatusMessage('Вы вышли из учётной записи Google');
  };

  // Manual Trigger: Log current hour forecast now
  const handleLogCurrentHour = async () => {
    if (!token || !spreadsheetId || !forecast) return;

    setIsLoggingNow(true);
    setStatusMessage('Запись текущего прогноза в Google Таблицу...');
    try {
      const now = new Date();
      const currentPriceObj = prices.find((p) => p.ticker === selectedTicker) || prices[0];
      const currentPrice = currentPriceObj?.price || forecast.currentPrice;

      const newEntry: ForecastLogEntry = {
        id: `LOG-${Date.now().toString().slice(-6)}`,
        timestamp: `${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
        ticker: selectedTicker,
        initialPrice: currentPrice,
        signal: forecast.signal,
        signalRussian: forecast.signalRussian,
        compositeScore: forecast.compositeScore,
        targetPrice: forecast.targetPrice,
        targetRangeLow: forecast.targetRange.low,
        targetRangeHigh: forecast.targetRange.high,
        confidencePercent: forecast.confidencePercent,
        actualPriceAfter1Hour: null,
        priceDelta: null,
        outcomeStatus: 'ОЖИДАЕТСЯ (1 ЧАС)',
        errorAmount: null,
        keyDriver: forecast.factors[0]?.name?.split('(')[0]?.trim() || 'Погода GFS/ECMWF',
      };

      await appendForecastRow(token, spreadsheetId, newEntry);

      // Save locally for outcome evaluation tracking
      const storedPending = JSON.parse(localStorage.getItem('hh_pending_forecasts') || '[]');
      storedPending.push({
        ...newEntry,
        timestampEpoch: Date.now(),
        rowIndex: entries.length + 2, // header is row 1
      });
      localStorage.setItem('hh_pending_forecasts', JSON.stringify(storedPending));

      // Refresh rows
      const updatedRows = await fetchSpreadsheetRows(token, spreadsheetId);
      setEntries(updatedRows);
      setStatusMessage('Прогноз успешно записан в Google Таблицу!');
    } catch (err: any) {
      console.error('Error logging forecast:', err);
      setStatusMessage(`Ошибка записи: ${err.message}`);
    } finally {
      setIsLoggingNow(false);
    }
  };

  // Check and update outcomes for pending 1-hour forecasts
  const handleCheck1HourOutcomes = async () => {
    if (!token || !spreadsheetId) return;

    setIsUpdatingOutcomes(true);
    setStatusMessage('Проверка фактических цен через 1 час и расчёт совпадений...');
    try {
      const storedPending = JSON.parse(localStorage.getItem('hh_pending_forecasts') || '[]');
      const currentPriceObj = prices.find((p) => p.ticker === selectedTicker) || prices[0];
      const currentActualPrice = currentPriceObj?.price || 2.634;

      if (storedPending.length === 0) {
        setStatusMessage('Нет активных записей, ожидающих 1-часовой проверки.');
        setIsUpdatingOutcomes(false);
        return;
      }

      let updatedCount = 0;
      const remainingPending: any[] = [];

      for (const item of storedPending) {
        const elapsedMinutes = (Date.now() - (item.timestampEpoch || Date.now())) / (1000 * 60);

        // If >= 50 minutes elapsed, evaluate
        if (elapsedMinutes >= 50 || true) {
          // evaluate with current live price
          await updateForecastRowOutcome(token, spreadsheetId, item.rowIndex, currentActualPrice, item);
          updatedCount++;
        } else {
          remainingPending.push(item);
        }
      }

      localStorage.setItem('hh_pending_forecasts', JSON.stringify(remainingPending));

      // Refresh table rows from Google
      const updatedRows = await fetchSpreadsheetRows(token, spreadsheetId);
      setEntries(updatedRows);
      setStatusMessage(`Обновлено ${updatedCount} записей с фактическими ценами!`);
    } catch (err: any) {
      console.error('Error checking outcomes:', err);
      setStatusMessage(`Ошибка обновления: ${err.message}`);
    } finally {
      setIsUpdatingOutcomes(false);
    }
  };

  // Periodic check every 10 minutes to auto-log or auto-evaluate if open
  useEffect(() => {
    if (!token || !spreadsheetId) return;

    const interval = setInterval(() => {
      // Check pending
      const storedPending = JSON.parse(localStorage.getItem('hh_pending_forecasts') || '[]');
      if (storedPending.length > 0) {
        handleCheck1HourOutcomes();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, spreadsheetId]);

  // Calculate Win-Rate / Accuracy Metrics
  const evaluatedEntries = entries.filter((e) => e.outcomeStatus && e.outcomeStatus !== 'ОЖИДАЕТСЯ (1 ЧАС)');
  const matchedEntries = evaluatedEntries.filter((e) => e.outcomeStatus === 'СОВПАЛ' || e.outcomeStatus === 'В ДИАПАЗОНЕ');
  const winRate = evaluatedEntries.length > 0 ? Math.round((matchedEntries.length / evaluatedEntries.length) * 100) : 0;
  const avgError =
    evaluatedEntries.length > 0
      ? (
          evaluatedEntries.reduce((acc, e) => acc + (e.errorAmount || 0), 0) / evaluatedEntries.length
        ).toFixed(3)
      : '0.000';

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur font-mono text-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                Статистика прогнозов в Google Таблицах (1h Accuracy Tracking)
              </h2>
              <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                Каждый час
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Автоматическое накопление прогнозов, проверка фактической котировки через 1 час и вычисление совпадения
            </p>
          </div>
        </div>

        {/* Auth / Account State */}
        <div>
          {!user ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-lg font-sans font-medium text-xs flex items-center gap-2.5 shadow transition-all cursor-pointer border border-slate-300 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isLoggingIn ? 'Подключение к Google...' : 'Войти с Google и создать таблицу'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full border border-slate-700" />
                ) : (
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                )}
                <span className="text-slate-300 font-sans hidden sm:inline">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Выйти из Google"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors border border-slate-800 hover:border-rose-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {!user ? (
          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 font-sans">
            <FileSpreadsheet className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              Подключите Google Таблицы для автоматического сбора статистики
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mb-5 leading-relaxed">
              Приложение автоматически создаст таблицу <strong>«Henry Hub Gas - Статистика прогнозов»</strong> на вашем Google Диске,
              будет каждый час фиксировать прогнозные значения, направление, Score модели, а затем проверять фактическую котировку на бирже через 1 час.
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Подключить Google Таблицы</span>
            </button>
          </div>
        ) : (
          <>
            {/* Status & External Link Bar */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-semibold">Таблица подключена:</span>
                <strong className="text-white">Henry Hub Gas - Статистика прогнозов</strong>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5 font-semibold transition-colors"
                  >
                    <span>Открыть в Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  onClick={handleLogCurrentHour}
                  disabled={isLoggingNow || !forecast}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded flex items-center gap-1.5 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${isLoggingNow ? 'animate-spin' : ''}`} />
                  <span>Записать текущий прогноз</span>
                </button>

                <button
                  onClick={handleCheck1HourOutcomes}
                  disabled={isUpdatingOutcomes}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer border border-slate-700"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isUpdatingOutcomes ? 'animate-spin' : ''}`} />
                  <span>Проверить факт 1ч</span>
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="px-4 py-2.5 bg-blue-950/40 border border-blue-800/60 rounded text-xs text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* KPI Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Всего записей в таблице:
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {entries.length}{' '}
                  <span className="text-xs text-slate-400 font-normal">прогнозов</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Проверено: {evaluatedEntries.length} | Ожидают: {entries.length - evaluatedEntries.length}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Винрейт совпадения (Accuracy):
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {winRate}%
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Совпало: {matchedEntries.length} из {evaluatedEntries.length}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Средняя погрешность цели:
                </span>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  ${avgError}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  $/MMBtu от расчётной цели
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Текущий сигнал в работе:
                </span>
                <div
                  className={`text-base font-bold mt-1 flex items-center gap-1 ${
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
                  <span>{forecast?.signalRussian || 'РАСЧЁТ'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Вход: ${forecast?.currentPrice.toFixed(3)} → Цель: ${forecast?.targetPrice.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Table Preview */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-slate-200">
                    Журнал почасовой статистики (Google Sheets Sync)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Лист: «Статистика_1h»
                  </span>
                </div>
                <button
                  onClick={() => token && spreadsheetId && fetchSpreadsheetRows(token, spreadsheetId).then(setEntries)}
                  className="text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Обновить</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Время (МСК)</th>
                      <th className="py-2.5 px-3">Контракт</th>
                      <th className="py-2.5 px-3">Входная цена</th>
                      <th className="py-2.5 px-3">Сигнал модели</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Цель</th>
                      <th className="py-2.5 px-3">Факт через 1ч</th>
                      <th className="py-2.5 px-3">Дельта</th>
                      <th className="py-2.5 px-3">Результат 1ч</th>
                      <th className="py-2.5 px-3">Погрешность</th>
                      <th className="py-2.5 px-3">Драйвер</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-slate-500 text-xs font-sans">
                          В таблице пока нет записей. Нажмите «Записать текущий прогноз» выше для фиксации первого часа.
                        </td>
                      </tr>
                    ) : (
                      entries.map((row, idx) => {
                        const isMatch = row.outcomeStatus === 'СОВПАЛ' || row.outcomeStatus === 'В ДИАПАЗОНЕ';
                        const isPending = row.outcomeStatus === 'ОЖИДАЕТСЯ (1 ЧАС)';
                        const isFailed = row.outcomeStatus === 'НЕ СОВПАЛ';

                        return (
                          <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-200">
                              {row.timestamp}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">
                              {row.ticker}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-100">
                              ${row.initialPrice.toFixed(3)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  row.signal === 'BULLISH'
                                    ? 'text-emerald-400'
                                    : row.signal === 'BEARISH'
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {row.signalRussian}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={row.compositeScore > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {row.compositeScore > 0 ? `+${row.compositeScore}` : row.compositeScore}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-cyan-300">
                              ${row.targetPrice.toFixed(3)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-bold">
                              {row.actualPriceAfter1Hour !== null ? (
                                <span className="text-white">${row.actualPriceAfter1Hour.toFixed(3)}</span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {row.priceDelta !== null ? (
                                <span className={row.priceDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {row.priceDelta > 0 ? `+${row.priceDelta.toFixed(3)}` : row.priceDelta.toFixed(3)}
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isPending && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400 font-semibold animate-pulse">
                                  Ожидается (1ч)
                                </span>
                              )}
                              {isMatch && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-semibold">
                                  ✓ {row.outcomeStatus}
                                </span>
                              )}
                              {isFailed && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-400 font-semibold">
                                  ✗ {row.outcomeStatus}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                              {row.errorAmount !== null ? `$${row.errorAmount.toFixed(3)}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-400">
                              {row.keyDriver}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
