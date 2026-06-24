import { DOW_JP } from './constants';

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function toDateStr(date) {
  // YYYY-MM-DD形式
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatJP(date) {
  // M月D日（曜）
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日（${DOW_JP[d.getDay()]}）`;
}

export function formatMonthJP(date) {
  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function sameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

export function getDaysInMonth(year, month) {
  // month: 0-indexed
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export function parseGASDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  // "2025/06/22" or "2025-06-22"
  return new Date(String(val).replace(/\//g, '-'));
}
