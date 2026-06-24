// ============================================================
// ギンザケ水揚げ予定管理 — Google Apps Script API
// ============================================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ★ここにスプレッドシートIDを入れる
const SHEET_SCHEDULE = '予定';
const SHEET_LOG      = '変更ログ';
const SHEET_RESULT   = '実績';
const SHEET_PRODUCER = 'マスター_生産者';
const SHEET_MARKET   = 'マスター_市場';

// CORSヘッダー付きレスポンス
function response(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================================
// GETハンドラ（読み取り系）
// ============================================================
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getSchedules')   return response(getSchedules(e.parameter));
    if (action === 'getMasters')     return response(getMasters());
    if (action === 'getLogs')        return response(getLogs(e.parameter));
    if (action === 'getResults')     return response(getResults(e.parameter));

    return response({ error: 'Unknown action: ' + action });
  } catch (err) {
    return response({ error: err.message });
  }
}

// ============================================================
// POSTハンドラ（書き込み系）
// ============================================================
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'addSchedule')    return response(addSchedule(body));
    if (action === 'updateSchedule') return response(updateSchedule(body));
    if (action === 'cancelSchedule') return response(cancelSchedule(body));
    if (action === 'deleteSchedule') return response(deleteSchedule(body));

    return response({ error: 'Unknown action: ' + action });
  } catch (err) {
    return response({ error: err.message });
  }
}

// ============================================================
// 予定の取得
// ============================================================
function getSchedules(params) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_SCHEDULE);
  const data  = sheet.getDataRange().getValues();

  if (data.length <= 1) return { schedules: [] };

  const headers = data[0];
  let schedules = data.slice(1).map(row => rowToSchedule(headers, row));

  // ステータスが「削除」の行は返さない
  schedules = schedules.filter(s => s.ステータス !== '削除');

  // 日付フィルタ（省略時は全件）
  if (params.dateFrom) {
    const from = new Date(params.dateFrom);
    schedules = schedules.filter(s => new Date(s.水揚日) >= from);
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo);
    schedules = schedules.filter(s => new Date(s.水揚日) <= to);
  }
  // 生産者フィルタ
  if (params.producerNo) {
    schedules = schedules.filter(s => s.生産者番号 === params.producerNo);
  }

  return { schedules };
}

// ============================================================
// 予定の新規追加
// ============================================================
function addSchedule(body) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_SCHEDULE);

  const id  = buildId(body.水揚日, body.生産者番号, body.市場番号);
  const now = new Date();

  // 重複チェック
  const existing = findRowById(sheet, id);
  if (existing >= 0) {
    return { error: '同じ予定IDがすでに存在します: ' + id };
  }

  const masters   = getMasters();
  const producer  = masters.producers.find(p => p.番号 === body.生産者番号) || {};
  const market    = masters.markets.find(m => m.番号 === body.市場番号) || {};

  const row = [
    id,                        // A: 予定ID
    formatDate(body.水揚日),   // B: 水揚日
    body.生産者番号,           // C: 生産者番号
    producer.氏名 || '',       // D: 生産者名
    producer.屋号 || '',       // E: 屋号
    body.市場番号,             // F: 市場番号
    market.市場名 || '',       // G: 市場名
    body.取引区分 || '上場',   // H: 取引区分
    body.予定トン数 || '',     // I: 予定トン数
    body.生簀番号 || '',       // J: 生簀番号
    body.メモ || '',           // K: メモ
    '予定',                    // L: ステータス
    '',                        // M: 変更先日付
    now,                       // N: 登録日時
    now,                       // O: 最終更新日時
    body.操作者 || '',         // P: 更新者
  ];

  sheet.appendRow(row);
  addLog('新規', id, null, body, body.操作者);

  return { success: true, id };
}

// ============================================================
// 予定の更新
// ============================================================
function updateSchedule(body) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_SCHEDULE);
  const rowIdx = findRowById(sheet, body.予定ID);

  if (rowIdx < 0) return { error: '予定IDが見つかりません: ' + body.予定ID };

  const before = rowToSchedule(
    sheet.getRange(1, 1, 1, 16).getValues()[0],
    sheet.getRange(rowIdx + 1, 1, 1, 16).getValues()[0]
  );
  const now = new Date();

  // 更新対象列のみ書き換え
  const updates = {
    H: body.取引区分,
    I: body.予定トン数,
    J: body.生簀番号,
    K: body.メモ,
    O: now,
    P: body.操作者 || '',
  };
  updateCols(sheet, rowIdx + 1, updates);

  addLog('変更', body.予定ID, before, body, body.操作者);
  return { success: true };
}

// ============================================================
// キャンセル
// ============================================================
function cancelSchedule(body) {
  const ss     = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet  = ss.getSheetByName(SHEET_SCHEDULE);
  const rowIdx = findRowById(sheet, body.予定ID);

  if (rowIdx < 0) return { error: '予定IDが見つかりません: ' + body.予定ID };

  const before = getRowValues(sheet, rowIdx + 1);
  const now    = new Date();

  updateCols(sheet, rowIdx + 1, { L: 'キャンセル', O: now, P: body.操作者 || '' });
  addLog('キャンセル', body.予定ID, before, { ステータス: 'キャンセル' }, body.操作者);

  return { success: true };
}

// ============================================================
// 削除（論理削除）
// ============================================================
function deleteSchedule(body) {
  const ss     = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet  = ss.getSheetByName(SHEET_SCHEDULE);
  const rowIdx = findRowById(sheet, body.予定ID);

  if (rowIdx < 0) return { error: '予定IDが見つかりません: ' + body.予定ID };

  const before = getRowValues(sheet, rowIdx + 1);
  const now    = new Date();

  updateCols(sheet, rowIdx + 1, { L: '削除', O: now, P: body.操作者 || '' });
  addLog('削除', body.予定ID, before, { ステータス: '削除' }, body.操作者);

  return { success: true };
}

// ============================================================
// 日程変更（元行を変更済みに + 新行を追加）
// ============================================================
function changeDateSchedule(body) {
  const ss     = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet  = ss.getSheetByName(SHEET_SCHEDULE);
  const rowIdx = findRowById(sheet, body.予定ID);

  if (rowIdx < 0) return { error: '予定IDが見つかりません: ' + body.予定ID };

  const now = new Date();

  // 元の行をステータス「日程変更」に
  updateCols(sheet, rowIdx + 1, {
    L: '日程変更',
    M: formatDate(body.新水揚日),
    O: now,
    P: body.操作者 || '',
  });

  // 変更先日付で新行を追加
  const origRow = getRowValues(sheet, rowIdx + 1);
  const newBody = {
    水揚日:     body.新水揚日,
    生産者番号: origRow.生産者番号,
    市場番号:   origRow.市場番号,
    取引区分:   origRow.取引区分,
    予定トン数: origRow.予定トン数,
    生簀番号:   origRow.生簀番号,
    メモ:       origRow.メモ,
    操作者:     body.操作者 || '',
  };

  addLog('日程変更', body.予定ID, origRow, newBody, body.操作者);
  return addSchedule(newBody);
}

// ============================================================
// マスターデータ取得
// ============================================================
function getMasters() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const pSheet = ss.getSheetByName(SHEET_PRODUCER);
  const pData  = pSheet.getDataRange().getValues();
  const producers = pData.slice(1).map(r => ({
    番号: r[0], 氏名: r[1], 屋号: r[2], 有効: r[3]
  })).filter(p => p.有効 == 1);

  const mSheet = ss.getSheetByName(SHEET_MARKET);
  const mData  = mSheet.getDataRange().getValues();
  const markets = mData.slice(1).map(r => ({
    番号: r[0], 市場名: r[1], 上場可: r[2], 相対可: r[3], 相対デフォルト: r[4]
  }));

  return { producers, markets };
}

// ============================================================
// 変更ログ取得
// ============================================================
function getLogs(params) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { logs: [] };

  let logs = data.slice(1).map(r => ({
    ログID:   r[0], 日時: r[1], 操作者: r[2],
    操作種別: r[3], 予定ID: r[4], 変更前: r[5], 変更後: r[6]
  }));

  if (params.scheduleId) {
    logs = logs.filter(l => l.予定ID === params.scheduleId);
  }
  // 新しい順
  logs.reverse();
  return { logs };
}

// ============================================================
// 実績取得
// ============================================================
function getResults(params) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_RESULT);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { results: [] };

  const headers = data[0];
  const results = data.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });
  return { results };
}

// ============================================================
// ユーティリティ
// ============================================================
function buildId(dateStr, producerNo, marketNo) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const p = String(producerNo).padStart(2, '0');
  return `${y}${m}${day}_${p}_${marketNo}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy/MM/dd');
}

function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i;
  }
  return -1;
}

function getRowValues(sheet, rowNum) {
  const headers = sheet.getRange(1, 1, 1, 16).getValues()[0];
  const row     = sheet.getRange(rowNum, 1, 1, 16).getValues()[0];
  return rowToSchedule(headers, row);
}

function rowToSchedule(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i]; });
  return obj;
}

function updateCols(sheet, rowNum, updates) {
  const colMap = { A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9, J:10, K:11, L:12, M:13, N:14, O:15, P:16 };
  Object.entries(updates).forEach(([col, val]) => {
    if (val !== undefined) {
      sheet.getRange(rowNum, colMap[col]).setValue(val);
    }
  });
}

function addLog(type, scheduleId, before, after, operator) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG);
  const lastRow = sheet.getLastRow();
  const logId   = String(lastRow).padStart(4, '0');

  sheet.appendRow([
    logId,
    new Date(),
    operator || '',
    type,
    scheduleId,
    before ? JSON.stringify(before) : '',
    after  ? JSON.stringify(after)  : '',
  ]);
}

// ============================================================
// 初期セットアップ（初回のみ実行）
// ============================================================
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 予定シート
  let sheet = ss.getSheetByName(SHEET_SCHEDULE) || ss.insertSheet(SHEET_SCHEDULE);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['予定ID','水揚日','生産者番号','生産者名','屋号','市場番号','市場名','取引区分','予定トン数','生簀番号','メモ','ステータス','変更先日付','登録日時','最終更新日時','更新者']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold').setBackground('#E6F1FB');
  }

  // 変更ログシート
  sheet = ss.getSheetByName(SHEET_LOG) || ss.insertSheet(SHEET_LOG);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ログID','日時','操作者','操作種別','予定ID','変更前','変更後']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold').setBackground('#FAEEDA');
  }

  // 実績シート
  sheet = ss.getSheetByName(SHEET_RESULT) || ss.insertSheet(SHEET_RESULT);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['伝票番号','予定ID','水揚日','生産者番号','市場番号','実績数量(kg)','尾数','水揚回数','税抜金額','差引仕切額','平均単価目安']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold').setBackground('#EAF3DE');
  }

  // マスター_生産者
  sheet = ss.getSheetByName(SHEET_PRODUCER) || ss.insertSheet(SHEET_PRODUCER);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['生産者番号','氏名','屋号','有効フラグ']);
    const producers = [
      ['01','木村茂','ヤマ七',1],
      ['02','木村豊','マルキ',1],
      ['03','木村友一','マル長',1],
      ['04','阿部功','カネ木',1],
      ['05','阿部亀一郎','イリヤマ三',1],
      ['06','阿部優一郎','向山',1],
      ['07','阿部剛','稲荷丸',1],
      ['08','遠藤貴大','寿丸',1],
    ];
    producers.forEach(r => sheet.appendRow(r));
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold').setBackground('#F1EFE8');
  }

  // マスター_市場
  sheet = ss.getSheetByName(SHEET_MARKET) || ss.insertSheet(SHEET_MARKET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['市場番号','市場名','上場可否','相対可否','相対デフォルト']);
    sheet.appendRow([1,'石巻魚市場',1,1,0]);
    sheet.appendRow([2,'女川魚市場',1,1,0]);
    sheet.appendRow([3,'志津川魚市場',0,1,1]);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold').setBackground('#F1EFE8');
  }

  Logger.log('セットアップ完了');
}
