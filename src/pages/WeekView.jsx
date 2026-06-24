import { useState, useMemo } from 'react';
import { MARKETS, MARKET_COLORS, STATUS, DOW_JP } from '../lib/constants';
import { today, addDays, toDateStr, sameDay, parseGASDate } from '../lib/dateUtils';
import { NavButton, Spinner, ErrorMsg } from '../components/UI';
import DayPopup from '../components/DayPopup';
import { useAllSchedules } from '../hooks/useSchedules';

export default function WeekView({ onGotoDay }) {
  const [startDate, setStartDate] = useState(today());
  const [popupDate, setPopupDate] = useState(null);
  const { schedules, loading, error } = useAllSchedules();

  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const byDay = useMemo(() => {
    const map = {};
    days.forEach(d => { map[toDateStr(d)] = []; });
    schedules.forEach(s => {
      if (s.ステータス === STATUS.DELETED || s.ステータス === STATUS.CHANGED) return;
      const key = toDateStr(parseGASDate(s.水揚日));
      if (map[key]) map[key].push(s);
    });

    // 各日の予定を並び替え：市場番号→上場/相対→生産者番号
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        // 1. 市場番号順
        const marketDiff = Number(a.市場番号) - Number(b.市場番号);
        if (marketDiff !== 0) return marketDiff;
        // 2. 取引区分順（上場=0, 相対=1）
        const tradeA = a.取引区分 === '上場' ? 0 : 1;
        const tradeB = b.取引区分 === '上場' ? 0 : 1;
        if (tradeA !== tradeB) return tradeA - tradeB;
        // 3. 生産者番号順
        return Number(a.生産者番号) - Number(b.生産者番号);
      });
    });

    return map;
  }, [schedules, startDate]);

  const td = today();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <NavButton onClick={() => setStartDate(d => addDays(d, -7))}>◀</NavButton>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
          {startDate.getMonth() + 1}月{startDate.getDate()}日 〜 {addDays(startDate, 6).getMonth() + 1}月{addDays(startDate, 6).getDate()}日
        </span>
        <NavButton onClick={() => setStartDate(today())}>今週</NavButton>
        <NavButton onClick={() => setStartDate(d => addDays(d, 7))}>▶</NavButton>
      </div>

      {loading && <Spinner />}
      {error && <ErrorMsg message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }} className="week-grid">
          {days.map(day => {
            const key = toDateStr(day);
            const list = byDay[key] || [];
            const isToday = sameDay(day, td);
            const isSun = day.getDay() === 0;
            const isSat = day.getDay() === 6;
            const activeCount = list.filter(s => s.ステータス === STATUS.PLANNED).length;

            return (
              <div key={key}
                onClick={() => setPopupDate(new Date(day))}
                style={{
                  border: isToday ? '1.5px solid #1565c0' : '0.5px solid var(--c-border)',
                  borderRadius: 8, overflow: 'hidden',
                  background: 'var(--c-bg)', minHeight: 80, cursor: 'pointer',
                }}>
                {/* 日付ヘッダー */}
                <div style={{
                  padding: '5px 6px',
                  background: isToday ? '#90caf9' : 'var(--c-bg-2)',
                  borderBottom: '0.5px solid var(--c-border)',
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 500,
                    color: isToday ? '#0d47a1' : isSun ? '#e53935' : isSat ? '#1565c0' : 'var(--c-text)',
                  }}>{day.getDate()}</div>
                  <div style={{ fontSize: 10, color: 'var(--c-text-3)' }}>{DOW_JP[day.getDay()]}</div>
                  {activeCount > 0 && (
                    <div style={{ fontSize: 9, color: 'var(--c-text-3)' }}>{activeCount}件</div>
                  )}
                </div>

                {/* 予定リスト */}
                <div style={{ padding: '3px 2px' }}>
                  {list.length === 0 && (
                    <div style={{ fontSize: 9, color: 'var(--c-text-3)', textAlign: 'center', padding: '8px 0' }}>—</div>
                  )}
                  {list.map(s => {
                    const isCancel = s.ステータス === STATUS.CANCEL;
                    const mc = MARKET_COLORS[String(s.市場番号)] || {};
                    const isJoto = s.取引区分 === '上場';
                    return (
                      <div key={s.予定ID} style={{
                        fontSize: 9, padding: '2px 4px', margin: '2px 3px', borderRadius: 3,
                        background: isCancel ? 'var(--c-bg-2)' : mc.bg,
                        color: isCancel ? 'var(--c-text-3)' : mc.text,
                        textDecoration: isCancel ? 'line-through' : 'none',
                        lineHeight: 1.4,
                        borderLeft: isCancel ? 'none' : `3px solid ${isJoto ? '#1565c0' : '#e65100'}`,
                      }}>
                        {s.屋号} {mc.label && <span style={{ opacity: .7 }}>{mc.label}</span>}
                        {isJoto ? ' 上' : ' 相'}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && (
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--c-text-3)' }}>
          {Object.entries(MARKET_COLORS).map(([no, c]) => (
            <span key={no} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
              {c.label}
            </span>
          ))}
          <span>上/相 = 上場/相対　<span style={{ textDecoration: 'line-through' }}>取消線</span> = キャンセル</span>
        </div>
      )}

      {popupDate && (
        <DayPopup
          date={popupDate}
          schedules={schedules}
          onClose={() => setPopupDate(null)}
          onGotoDay={() => { onGotoDay(popupDate); setPopupDate(null); }}
        />
      )}

      <style>{`
        @media (max-width: 600px) {
          .week-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}