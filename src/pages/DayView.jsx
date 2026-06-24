import { useState, useMemo } from 'react';
import { MARKETS, MARKET_COLORS, STATUS, DOW_JP } from '../lib/constants';
import { today, addDays, toDateStr, sameDay, parseGASDate } from '../lib/dateUtils';
import { TradeBadge, NavButton, Spinner, ErrorMsg, EmptyMsg } from '../components/UI';
import ScheduleForm from '../components/ScheduleForm';
import { useAllSchedules } from '../hooks/useSchedules';

export default function DayView({ initialDate, onDateConsumed }) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialDate) { onDateConsumed?.(); return initialDate; }
    return today();
  });
  const [editTarget, setEditTarget] = useState(null);
  const { schedules, loading, error, reload } = useAllSchedules();

  const dateLabel = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日（${DOW_JP[currentDate.getDay()]}）`;

  const daySchedules = useMemo(() => {
    return schedules.filter(s => {
      const d = parseGASDate(s.水揚日);
      if (!sameDay(d, currentDate)) return false;
      if (s.ステータス === STATUS.DELETED || s.ステータス === STATUS.CHANGED) return false;
      return true;
    });
  }, [schedules, currentDate]);

  const activeCount = daySchedules.filter(s => s.ステータス === STATUS.PLANNED).length;

  const grouped = useMemo(() => {
    const result = {};
    MARKETS.forEach(m => { result[m.no] = { 上場: [], 相対: [] }; });
    daySchedules.forEach(s => {
      const bucket = result[s.市場番号];
      if (!bucket) return;
      const trade = s.取引区分 === '相対' ? '相対' : '上場';
      bucket[trade].push(s);
    });
    return result;
  }, [daySchedules]);

  function openEdit(s) {
    setEditTarget({ ...s, 水揚日_str: toDateStr(parseGASDate(s.水揚日)) });
  }

  function closeForm() {
    setEditTarget(null);
    reload();
  }

  function handleDateChange(e) {
    const d = new Date(e.target.value);
    if (!isNaN(d)) setCurrentDate(d);
  }

  return (
    <div>
      {/* 日付ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <NavButton onClick={() => setCurrentDate(d => addDays(d, -1))}>◀ 前日</NavButton>
        <NavButton onClick={() => setCurrentDate(today())} active>本日</NavButton>
        <NavButton onClick={() => setCurrentDate(d => addDays(d, 1))}>翌日 ▶</NavButton>
      </div>

      {/* 日付タイトル＋日付ピッカー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 20, fontWeight: 500 }}>{dateLabel}</span>
        <span style={{
          fontSize: 12, color: 'var(--c-text-3)',
          background: 'var(--c-bg-2)', padding: '2px 10px', borderRadius: 20
        }}>水揚げ {activeCount}件</span>
        <input
          type="date"
          value={toDateStr(currentDate)}
          onChange={handleDateChange}
          style={{
            marginLeft: 'auto',
            padding: '5px 8px', fontSize: 12,
            border: '0.5px solid var(--c-border-2)', borderRadius: 8,
            background: 'var(--c-bg)', color: 'var(--c-text)',
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        />
      </div>

      {loading && <Spinner />}
      {error && <ErrorMsg message={error} />}

      {!loading && !error && MARKETS.map(market => {
        const jotoList  = grouped[market.no]?.上場 || [];
        const sotaiList = grouped[market.no]?.相対 || [];
        const hasAny    = jotoList.length > 0 || sotaiList.length > 0;
        if (!hasAny) return null;
        const mc = MARKET_COLORS[market.no];

        return (
          <div key={market.no} style={{
            marginBottom: 12,
            border: '0.5px solid var(--c-border)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {/* 市場ヘッダー */}
            <div style={{
              padding: '8px 12px', fontSize: 13, fontWeight: 500,
              background: mc.bg, color: mc.text,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              📍 {market.name}
            </div>

            {/* 上場セクション */}
            {jotoList.length > 0 && (
              <>
                <div style={{
                  padding: '5px 12px', fontSize: 11, fontWeight: 500,
                  color: '#0d47a1', background: '#90caf9',
                  borderTop: '0.5px solid var(--c-border)',
                  borderBottom: '0.5px solid var(--c-border)',
                  letterSpacing: '.04em',
                }}>上場</div>
                {jotoList.map(s => <ProducerRow key={s.予定ID} schedule={s} onEdit={() => openEdit(s)} />)}
              </>
            )}

            {/* 相対セクション */}
            {sotaiList.length > 0 && (
              <>
                <div style={{
                  padding: '5px 12px', fontSize: 11, fontWeight: 500,
                  color: '#e65100', background: '#ffe0b2',
                  borderTop: '0.5px solid var(--c-border)',
                  borderBottom: '0.5px solid var(--c-border)',
                  letterSpacing: '.04em',
                }}>相対</div>
                {sotaiList.map(s => <ProducerRow key={s.予定ID} schedule={s} onEdit={() => openEdit(s)} />)}
              </>
            )}
          </div>
        );
      })}

      {!loading && !error && daySchedules.length === 0 && (
        <EmptyMsg>この日の予定はありません</EmptyMsg>
      )}

      {editTarget === null && (
        <button onClick={() => setEditTarget('new')} style={{
          width: '100%', padding: 10,
          border: '0.5px dashed var(--c-border-2)', borderRadius: 12,
          background: 'none', color: 'var(--c-text-3)', fontSize: 13,
          cursor: 'pointer', marginTop: 8, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>＋ 予定を追加</button>
      )}

      {editTarget !== null && (
        <div style={{ border: '0.5px solid var(--c-border)', borderRadius: 12, overflow: 'hidden', marginTop: 8, background: 'var(--c-bg)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--c-border)', fontSize: 14, fontWeight: 500 }}>
            {editTarget === 'new' ? `${dateLabel} — 新規登録` : `${editTarget.生産者名}（${editTarget.屋号}）— 編集`}
          </div>
          <ScheduleForm
            initial={editTarget === 'new' ? { 水揚日_str: toDateStr(currentDate) } : editTarget}
            onSaved={closeForm}
            onCancel={() => setEditTarget(null)}
            onCancelPlan={closeForm}
            onDelete={closeForm}
          />
        </div>
      )}
    </div>
  );
}

function ProducerRow({ schedule: s, onEdit }) {
  const isCancel = s.ステータス === STATUS.CANCEL;
  return (
    <div style={{
      padding: '8px 12px', borderTop: '0.5px solid var(--c-border)',
      background: 'var(--c-bg)', display: 'flex', alignItems: 'center', gap: 8,
      opacity: isCancel ? 0.4 : 1,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{s.生産者名}</span>
          <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{s.屋号}</span>
          {isCancel && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: '#ffccbc', color: '#bf360c' }}>キャンセル</span>}
        </div>
        {(s.予定トン数 || s.生簀番号) && (
          <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>
            {s.予定トン数 && `${s.予定トン数}t`}{s.予定トン数 && s.生簀番号 && ' ・ '}{s.生簀番号}
          </div>
        )}
        {s.メモ && <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 1 }}>{s.メモ}</div>}
      </div>
      <button onClick={onEdit} style={{
        background: 'none', border: '0.5px solid var(--c-border)',
        borderRadius: 6, padding: '3px 8px',
        fontSize: 11, color: 'var(--c-text-3)', cursor: 'pointer', fontFamily: 'inherit',
      }}>編集</button>
    </div>
  );
}