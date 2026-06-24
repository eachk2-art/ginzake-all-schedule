const GAS_URL = import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbyDemVMP4YzTwcTTL7jnjQiHN0ZGIO9AmiPQFABckeAlyp3CGI1bWFbHCdPrjxGpiprtQ/exec';

async function gasGet(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function gasPost(body) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function fetchSchedules({ dateFrom, dateTo, producerNo } = {}) {
  const params = { action: 'getSchedules' };
  if (dateFrom)   params.dateFrom   = dateFrom;
  if (dateTo)     params.dateTo     = dateTo;
  if (producerNo) params.producerNo = producerNo;
  return gasGet(params);
}

export async function fetchMasters() {
  return gasGet({ action: 'getMasters' });
}

export async function fetchLogs(scheduleId) {
  const params = { action: 'getLogs' };
  if (scheduleId) params.scheduleId = scheduleId;
  return gasGet(params);
}

export async function fetchResults() {
  return gasGet({ action: 'getResults' });
}

export async function addSchedule(data) {
  return gasPost({ action: 'addSchedule', ...data });
}

export async function updateSchedule(data) {
  return gasPost({ action: 'updateSchedule', ...data });
}

export async function cancelSchedule(scheduleId, operator) {
  return gasPost({ action: 'cancelSchedule', 予定ID: scheduleId, 操作者: operator });
}

export async function uncancelSchedule(scheduleId, operator) {
  return gasPost({ action: 'uncancelSchedule', 予定ID: scheduleId, 操作者: operator });
}

export async function deleteSchedule(scheduleId, operator) {
  return gasPost({ action: 'deleteSchedule', 予定ID: scheduleId, 操作者: operator });
}

export async function changeDateSchedule(scheduleId, newDate, operator) {
  return gasPost({ action: 'changeDateSchedule', 予定ID: scheduleId, 新水揚日: newDate, 操作者: operator });
}