import { useMemo } from 'react';
import { MARKETS, MARKET_COLORS, STATUS, DOW_JP } from '../lib/constants';
import { parseGASDate, sameDay } from '../lib/dateUtils';

export default function DayPopup({ date, schedules, onClose, onGotoDay }) {
  const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日（${DOW_JP[date.getDay()]}）`;

  const daySchedules = useMemo(() => {
    return schedules.filter(s => {
      const d = parseGASDate(s.水揚日);
      if (!sameDay(d, date)) return false;
      if (s.ステータス === STATUS.DELETED || s.ステータス === STATUS.CHANGED) return false;
      return true;
    });
  }, [schedules, date]);

  const activeCount = daySchedules.filter(s => s.ステータス === STATUS.PLANNED).length;

  // 市場→上場/相対→生産者番号順にグループ化
  const grouped = useMemo(() => {
    const result = {};
    MARKETS.forEach(m => { result[m.no] = { 上場: [], 相対: [] }; });
    daySchedules.forEach(s => {
      const bucket = result[String(s.市場番号)];
      if (!bucket) return;
      const trade = s.取引区分 === '相対' ? '相対' : '上場';
      bucket[trade].push(s);
    });
    // 生産者番号順にソート
    Object.values(result).forEach(bucket => {
      bucket.上場.sort((a, b) => Number(a.生産者番号) - Number(b.生産者番号));
      bucket.相対.sort((a, b) => Number(a.生産者番号) - Number(b.生産者番号));
    });
    return result;
  }, [daySchedules]);

  return (
    <>
      {/* 背景オーバーレイ */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 100,
      }} />

      {/* ポップアップ本体 */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(420px, 92vw)',
        maxHeight: '80vh',
        background: 'var(--c-bg)',
        borderRadius: 14,
        overflow: 'hidden',
        zIndex: 101,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '0.5px solid var(--c-border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16, fontWeight: 500, flex: 1 }}>{dateLabel}</span>
          <span style={{
            fontSize: 11, color: 'var(--c-text-3)',
            background: 'var(--c-bg-2)', padding: '2px 8px', borderRadius: 20,
          }}>水揚げ {activeCount}件</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 18,
            color: 'var(--c-text-3)', cursor: 'pointer', padding: '0 4px',
          }}>×</button>
        </div>

        {/* 予定リスト */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {daySchedules.length === 0 && (
            <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--c-text-3)', textAlign: 'center' }}>
              この日の予定はありません
            </div>
          )}

          {MARKETS.map(market => {
            const jotoList  = grouped[market.no]?.上場 || [];
            const sotaiList = grouped[market.no]?.相対 || [];
            const hasAny    = jotoList.length > 0 || sotaiList.length > 0;
            if (!hasAny) return null;
            const mc = MARKET_COLORS[market.no];

            return (
              <div key={market.no} style={{ marginBottom: 8 }}>
                {/* 市場ヘッダー */}
                <div style={{
                  padding: '6px 16px', fontSize: 12, fontWeight: 500,
                  background: mc.bg, color: mc.text,
                }}>
                  📍 {market.name}
                </div>

                {/* 上場 */}
                {jotoList.length > 0 && (
                  <>
                    <div style={{
                      padding: '4px 16px', fontSize: 10, fontWeight: 500,
                      color: '#0d47a1', background: '#90caf9',
                      borderTop: '0.5px solid var(--c-border)',
                      borderBottom: '0.5px solid var(--c-border)',
                    }}>上場</div>
                    {jotoList.map(s => <PopupRow key={s.予定ID} schedule={s} />)}
                  </>
                )}

                {/* 相対 */}
                {sotaiList.length > 0 && (
                  <>
                    <div style={{
                      padding: '4px 16px', fontSize: 10, fontWeight: 500,
                      color: '#e65100', background: '#ffe0b2',
                      borderTop: '0.5px solid var(--c-border)',
                      borderBottom: '0.5px solid var(--c-border)',
                    }}>相対</div>
                    {sotaiList.map(s => <PopupRow key={s.予定ID} schedule={s} />)}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* フッターボタン */}
        <div style={{
          padding: '10px 16px',
          borderTop: '0.5px solid var(--c-border)',
          display: 'flex', gap: 8,
        }}>
          <button onClick={onGotoDay} style={{
            flex: 1, padding: '9px',
            background: 'var(--c-text)', color: 'var(--c-bg)',
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>この日の詳細を見る →</button>
          <button onClick={onClose} style={{
            padding: '9px 16px',
            background: 'none', color: 'var(--c-text-3)',
            border: '0.5px solid var(--c-border-2)', borderRadius: 8,
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>閉じる</button>
        </div>
      </div>
    </>
  );
}

function PopupRow({ schedule: s }) {
  const isCancel = s.ステータス === STATUS.CANCEL;
  return (
    <div style={{
      padding: '7px 16px',
      borderTop: '0.5px solid var(--c-border)',
      opacity: isCancel ? 0.45 : 1,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{s.生産者名}</span>
          <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{s.屋号}</span>
          {isCancel && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: '#ffccbc', color: '#bf360c' }}>
              キャンセル
            </span>
          )}
        </div>
        {(s.予定トン数 || s.生簀番号) && (
          <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 1 }}>
            {s.予定トン数 && `${s.予定トン数}t`}{s.予定トン数 && s.生簀番号 && ' ・ '}{s.生簀番号}
          </div>
        )}
        {s.メモ && (
          <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 1 }}>{s.メモ}</div>
        )}
      </div>
    </div>
  );
}