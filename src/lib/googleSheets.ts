export interface ForecastLogEntry {
  id: string;
  timestamp: string; // ISO or formatted
  ticker: string;
  initialPrice: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signalRussian: string;
  compositeScore: number;
  targetPrice: number;
  targetRangeLow: number;
  targetRangeHigh: number;
  confidencePercent: number;
  actualPriceAfter1Hour: number | null;
  priceDelta: number | null;
  outcomeStatus: 'СОВПАЛ' | 'НЕ СОВПАЛ' | 'В ДИАПАЗОНЕ' | 'ОЖИДАЕТСЯ (1 ЧАС)' | null;
  errorAmount: number | null;
  keyDriver: string;
}

const SPREADSHEET_TITLE = 'Henry Hub Gas - Статистика прогнозов';

export async function findOrCreateSpreadsheet(accessToken: string): Promise<{ spreadsheetId: string; url: string; isNew: boolean }> {
  // 1. Search for existing file in Drive
  const query = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet'`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const file = searchData.files[0];
      return {
        spreadsheetId: file.id,
        url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
        isNew: false,
      };
    }
  }

  // 2. Create new spreadsheet if not found
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: 'Статистика_1h',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Ошибка создания таблицы Google: ${await createRes.text()}`);
  }

  const createData = await createRes.json();
  const spreadsheetId = createData.spreadsheetId;
  const sheetUrl = createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Initialize Header Row
  const headers = [
    'ID',
    'Дата и время прогноза (МСК)',
    'Фьючерс',
    'Цена в момент прогноза ($/MMBtu)',
    'Сигнал модели',
    'Score (-100..+100)',
    'Целевая цена ($)',
    'Целевой диапазон ($)',
    'Уверенность (%)',
    'Цена через 1 час ($)',
    'Дельта цены ($)',
    'Результат через 1 час',
    'Погрешность ($)',
    'Главный фактор прогноза',
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Статистика_1h!A1:N1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: 'Статистика_1h!A1:N1',
      majorDimension: 'ROWS',
      values: [headers],
    }),
  });

  // 4. Style Header Row with batchUpdate
  try {
    const sheetId = createData.sheets?.[0]?.properties?.sheetId || 0;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.12, blue: 0.18 }, // Dark slate header
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 14,
              },
            },
          },
        ],
      }),
    });
  } catch (e) {
    console.warn('Header styling fallback', e);
  }

  return {
    spreadsheetId,
    url: sheetUrl,
    isNew: true,
  };
}

export async function fetchSpreadsheetRows(accessToken: string, spreadsheetId: string): Promise<ForecastLogEntry[]> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Статистика_1h!A2:N100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Не удалось прочитать таблицу: ${res.statusText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((r: any[], idx: number) => {
    const initialPrice = parseFloat(r[3]) || 0;
    const actualPrice = r[9] ? parseFloat(r[9]) : null;
    return {
      id: r[0] || `entry-${idx + 1}`,
      timestamp: r[1] || '',
      ticker: r[2] || '',
      initialPrice,
      signal: (r[4]?.includes('БЫЧИЙ') ? 'BULLISH' : r[4]?.includes('МЕДВЕЖИЙ') ? 'BEARISH' : 'NEUTRAL') as any,
      signalRussian: r[4] || 'НЕЙТРАЛЬНЫЙ',
      compositeScore: parseFloat(r[5]) || 0,
      targetPrice: parseFloat(r[6]) || 0,
      targetRangeLow: parseFloat((r[7] || '').split('–')[0]?.trim()) || 0,
      targetRangeHigh: parseFloat((r[7] || '').split('–')[1]?.trim()) || 0,
      confidencePercent: parseInt(r[8], 10) || 0,
      actualPriceAfter1Hour: actualPrice,
      priceDelta: r[10] ? parseFloat(r[10]) : null,
      outcomeStatus: r[11] || 'ОЖИДАЕТСЯ (1 ЧАС)',
      errorAmount: r[12] ? parseFloat(r[12]) : null,
      keyDriver: r[13] || '',
    };
  });
}

export async function appendForecastRow(accessToken: string, spreadsheetId: string, entry: ForecastLogEntry): Promise<number> {
  const rowValues = [
    entry.id,
    entry.timestamp,
    entry.ticker,
    entry.initialPrice.toFixed(3),
    entry.signalRussian,
    entry.compositeScore > 0 ? `+${entry.compositeScore}` : `${entry.compositeScore}`,
    entry.targetPrice.toFixed(3),
    `$${entry.targetRangeLow.toFixed(3)} – $${entry.targetRangeHigh.toFixed(3)}`,
    `${entry.confidencePercent}%`,
    entry.actualPriceAfter1Hour !== null ? entry.actualPriceAfter1Hour.toFixed(3) : '',
    entry.priceDelta !== null ? (entry.priceDelta > 0 ? `+${entry.priceDelta.toFixed(3)}` : entry.priceDelta.toFixed(3)) : '',
    entry.outcomeStatus || 'ОЖИДАЕТСЯ (1 ЧАС)',
    entry.errorAmount !== null ? `$${entry.errorAmount.toFixed(3)}` : '',
    entry.keyDriver,
  ];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Статистика_1h!A:N:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: 'Статистика_1h!A:N',
      majorDimension: 'ROWS',
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ошибка записи в таблицу: ${await res.text()}`);
  }

  const result = await res.json();
  // Extract appended row index from updatedRange (e.g. "Статистика_1h!A5:N5")
  const match = result.updates?.updatedRange?.match(/A(\d+)/);
  return match ? parseInt(match[1], 10) : 2;
}

export async function updateForecastRowOutcome(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number,
  actualPrice: number,
  entry: ForecastLogEntry
): Promise<void> {
  const delta = Number((actualPrice - entry.initialPrice).toFixed(3));
  const err = Number(Math.abs(actualPrice - entry.targetPrice).toFixed(3));

  let outcome: 'СОВПАЛ' | 'НЕ СОВПАЛ' | 'В ДИАПАЗОНЕ' = 'НЕ СОВПАЛ';

  if (entry.signal === 'BULLISH') {
    if (actualPrice > entry.initialPrice) {
      outcome = 'СОВПАЛ';
    }
  } else if (entry.signal === 'BEARISH') {
    if (actualPrice < entry.initialPrice) {
      outcome = 'СОВПАЛ';
    }
  } else {
    // Neutral
    if (actualPrice >= entry.targetRangeLow && actualPrice <= entry.targetRangeHigh) {
      outcome = 'В ДИАПАЗОНЕ';
    }
  }

  // Range J{row}:M{row} corresponds to Price 1h, Delta, Outcome, Error
  const updateValues = [
    actualPrice.toFixed(3),
    delta > 0 ? `+${delta.toFixed(3)}` : `${delta.toFixed(3)}`,
    outcome,
    `$${err.toFixed(3)}`,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Статистика_1h!J${rowIndex}:M${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `Статистика_1h!J${rowIndex}:M${rowIndex}`,
        majorDimension: 'ROWS',
        values: [updateValues],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Ошибка обновления результата в таблице: ${await res.text()}`);
  }
}
