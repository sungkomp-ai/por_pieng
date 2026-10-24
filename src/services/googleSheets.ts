import { getAccessToken } from './googleAuth';

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheetNames: string[];
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  // Regex to match spreadsheet ID from URL
  // e.g., https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function fetchSpreadsheetMetadata(spreadsheetId: string): Promise<SheetMetadata> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google ก่อนดำเนินการ');

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `ไม่สามารถเปิดเอกสาร Google Sheets ได้ (รหัสสถานะ: ${res.status})`);
  }

  const data = await res.json();
  const sheetNames = (data.sheets || []).map((s: any) => s.properties.title);
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Google Sheet',
    sheetNames
  };
}

export async function ensureSheetTabExists(spreadsheetId: string, sheetName: string): Promise<void> {
  const meta = await fetchSpreadsheetMetadata(spreadsheetId);
  if (meta.sheetNames.includes(sheetName)) {
    return;
  }

  // Add sheet tab via batchUpdate
  const token = await getAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: { title: sheetName }
          }
        }
      ]
    })
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || 'ไม่สามารถสร้างแท็บชีตใหม่ได้');
  }
}

export async function appendToGoogleSheet(
  spreadsheetId: string,
  sheetName: string,
  headerRow: (string | number)[],
  rowsToAppend: (string | number)[][]
): Promise<{ updatedRows: number }> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google ก่อนส่งข้อมูล');

  // Ensure sheet tab exists
  await ensureSheetTabExists(spreadsheetId, sheetName);

  // Check if sheet already has rows
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  let needsHeader = false;
  if (readRes.ok) {
    const readData = await readRes.json();
    if (!readData.values || readData.values.length === 0 || readData.values[0].length === 0) {
      needsHeader = true;
    }
  } else {
    needsHeader = true;
  }

  const finalValues: (string | number)[][] = [];
  if (needsHeader && headerRow.length > 0) {
    finalValues.push(headerRow);
  }
  finalValues.push(...rowsToAppend);

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: finalValues
      })
    }
  );

  if (!appendRes.ok) {
    const errorBody = await appendRes.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Google Sheets');
  }

  const appendResult = await appendRes.json();
  return {
    updatedRows: appendResult.updates?.updatedRows || rowsToAppend.length
  };
}
