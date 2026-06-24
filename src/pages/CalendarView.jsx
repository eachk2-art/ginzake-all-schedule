import { useState, useMemo } from 'react';
import { MARKET_COLORS, STATUS } from '../lib/constants';
import { today, toDateStr, sameDay, parseGASDate, getDaysInMonth, getFirstDayOfWeek } from '../lib/dateUtils';
import { NavButton, Spinner, ErrorMsg } from '../components/UI';
import DayPopup from '../components/DayPopup';
import { useAllSchedules } from '../hooks/useSchedules';

export default function CalendarView({ onGotoDay }) {
  const now = today();
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [popupDate, setPopupDate] = useState(null);

  const { schedules, loading, error } = useAllSchedules();

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const daysInMonth    = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  const dayMap = useMemo(() => {
    const map = {};
    schedules.forEach(s => {
      if (s.ステータス === STATUS.DELETED || s.ステータス === STATUS.CHANGED || s.ステータス === STATUS.CANCEL) return;
      const d = parseGASDate(s.水揚日);
      if (!d || d.getFullYear() !== year || d.getMonth() !== month) return;
      const day = d.getDate();
      if (!map[day]) map[day] = {};
      const no = s.市場番号;
      map[day][no] = (map[day][no] || 0) + 1;
    });
    return map;
  }, [schedules, year, month]);

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <NavButton onClick={prevMonth}>◀</NavButton>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{year}年{month + 1}月</span>
        <NavButton onClick={nextMonth}>▶</NavButton>
      </div>

      {loading && <Spinner />}
      {error && <ErrorMsg message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
            {DOW_LABELS.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 10,
                color: i === 0 ? '#A32D2D' : i === 6 ? '#185FA5' : 'var(--c-text-3)',
                padding: '3px 0',
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dt = new Date(year, month, day);
              const isToday = sameDay(dt, now);
              const isSun   = dt.getDay() === 0;
              const isSat   = dt.getDay() === 6;
              const dots    = dayMap[day] || {};
              const hasPlans = Object.keys(dots).length > 0;

              return (
                <div key={day}
                  onClick={() => setPopupDate(new Date(year, month, day))}
                  style={{
                    border: isToday ? '1.5px solid #378ADD' : '0.5px solid var(--c-border)',
                    borderRadius: 6, padding: '4px 3px', minHeight: 52,
                    background: 'var(--c-bg)', cursor: 'pointer',
                  }}>
                  <div style={{
                    fontSize: 11, fontWeight: 500, marginBottom: 3,
                    color: isToday ? '#185FA5' : isSun ? '#A32D2D' : isSat ? '#185FA5' : 'var(--c-text)',
                  }}>{day}</div>
                  {Object.entries(dots).map(([marketNo, count]) => {
                    const mc = MARKET_COLORS[marketNo];
                    if (!mc) return null;
                    return (
                      <div key={marketNo} style={{
                        fontSize: 9, padding: '1px 3px', borderRadius: 3,
                        background: mc.bg, color: mc.text,
                        marginBottom: 1, lineHeight: 1.4,
                      }}>
                        {mc.label} {count}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--c-text-3)' }}>
            {Object.entries(MARKET_COLORS).map(([no, c]) => (
              <span key={no} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
                {c.label}
              </span>
            ))}
            <span>※件数はキャンセル除く</span>
          </div>
        </>
      )}

      {popupDate && (
        <DayPopup
          date={popupDate}
          schedules={schedules}
          onClose={() => setPopupDate(null)}
          onGotoDay={() => { onGotoDay(popupDate); setPopupDate(null); }}
        />
      )}
    </div>
  );
}