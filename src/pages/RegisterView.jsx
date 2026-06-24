import { useState, useMemo } from 'react';
import { PRODUCERS, MARKETS, MARKET_COLORS, STATUS, DOW_JP } from '../lib/constants';
import { today, toDateStr, parseGASDate, getDaysInMonth } from '../lib/dateUtils';
import { NavButton, Spinner, ErrorMsg } from '../components/UI';
import ScheduleForm from '../components/ScheduleForm';
import { useAllSchedules } from '../hooks/useSchedules';
import * as api from '../lib/api';

export default function RegisterView() {
  const now = today();
  const [step, setStep]               = useState('producer');
  const [selectedProducer, setProducer] = useState(null);
  const [year, setYear]               = useState(now.getFullYear());
  const [month, setMonth]             = useState(now.getMonth());
  const [openDay, setOpenDay]         = useState(null);
  const [editTarget, setEditTarget]   = useState(null);

  // 複数選択モード
  const [multiMode, setMultiMode]     = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkSaving, setBulkSaving]   = useState(false);
  const [bulkError, setBulkError]     = useState('');
  const [bulkForm, setBulkForm]       = useState({
    市場番号: '', 取引区分: '上場', 予定トン数: '', 生簀番号: '', メモ: '',
  });

  const { schedules, loading, error, reload } = useAllSchedules();

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const monthSchedules = useMemo(() => {
    if (!selectedProducer) return {};
    const map = {};
    schedules.forEach(s => {
      if (s.ステータス === STATUS.DELETED) return;
      if (Number(s.生産者番号) !== Number(selectedProducer.no)) return;
      const d = parseGASDate(s.水揚日);
      if (!d || d.getFullYear() !== year || d.getMonth() !== month) return;
      map[d.getDate()] = s;
    });
    return map;
  }, [schedules, selectedProducer, year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function toggleMultiMode() {
    setMultiMode(m => !m);
    setSelectedDays([]);
    setShowBulkForm(false);
    setBulkError('');
    setOpenDay(null);
    setEditTarget(null);
  }

  function toggleDay(day) {
    // 既存予定がある日は複数選択不可
    if (monthSchedules[day]) return;
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function handleDayClick(day) {
    if (multiMode) {
      toggleDay(day);
      return;
    }
    const dateStr = toDateStr(new Date(year, month, day));
    const existing = monthSchedules[day];
    if (existing) {
      setEditTarget({ ...existing, 水揚日_str: dateStr });
    } else {
      setEditTarget({ 水揚日_str: dateStr, 生産者番号: selectedProducer.no });
    }
    setOpenDay(dateStr);
  }

  function closeForm() {
    setOpenDay(null);
    setEditTarget(null);
    reload();
  }

  async function handleBulkSave() {
    if (!bulkForm.市場番号) {
      setBulkError('市場を選択してください');
      return;
    }
    if (selectedDays.length === 0) {
      setBulkError('日付を選択してください');
      return;
    }
    setBulkSaving(true);
    setBulkError('');
    const operator = localStorage.getItem('ginzake_operator') || '';
    const errors = [];

    for (const day of selectedDays.sort((a, b) => a - b)) {
      const dateStr = toDateStr(new Date(year, month, day));
      try {
        await api.addSchedule({
          水揚日:     dateStr,
          生産者番号: selectedProducer.no,
          市場番号:   bulkForm.市場番号,
          取引区分:   bulkForm.取引区分,
          予定トン数: bulkForm.予定トン数,
          生簀番号:   bulkForm.生簀番号,
          メモ:       bulkForm.メモ,
          操作者:     operator,
        });
      } catch (e) {
        errors.push(`${month + 1}/${day}: ${e.message}`);
      }
    }

    setBulkSaving(false);
    if (errors.length > 0) {
      setBulkError('一部エラー: ' + errors.join(' / '));
    } else {
      setMultiMode(false);
      setSelectedDays([]);
      setShowBulkForm(false);
      setBulkForm({ 市場番号: '', 取引区分: '上場', 予定トン数: '', 生簀番号: '', メモ: '' });
      reload();
    }
  }

  const radioStyle = (active, color) => ({
    padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
    border: active ? `1.5px solid ${color || '#0d47a1'}` : '0.5px solid var(--c-border-2)',
    background: active ? (color || '#0d47a1') : 'none',
    color: active ? '#ffffff' : 'var(--c-text)',
    fontFamily: 'inherit',
  });
  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    border: '0.5px solid var(--c-border-2)', borderRadius: 8,
    background: 'var(--c-bg)', color: 'var(--c-text)', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, color: 'var(--c-text-3)', marginBottom: 4, display: 'block' };

  // ── STEP1: 生産者選択 ──
  if (step === 'producer') {
    return (
      <div>
        <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginBottom: 10 }}>
          生産者を選択してください
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PRODUCERS.map(p => (
            <button key={p.no} onClick={() => { setProducer(p); setStep('month'); }}
              style={{
                border: '0.5px solid var(--c-border)', borderRadius: 8,
                padding: '10px 12px', cursor: 'pointer', background: 'var(--c-bg)',
                textAlign: 'left', fontFamily: 'inherit', color: 'var(--c-text)',
              }}>
              <div style={{ fontSize: 10, color: 'var(--c-text-3)' }}>{p.no}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{p.yago}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP2: 月カレンダー ──
  const bulkMarket = MARKETS.find(m => m.no === bulkForm.市場番号);

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => { setStep('producer'); setOpenDay(null); setEditTarget(null); setMultiMode(false); setSelectedDays([]); }}
          style={{ background: 'none', border: '0.5px solid var(--c-border-2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: 'var(--c-text-3)', fontFamily: 'inherit' }}>
          ◀ 生産者
        </button>
        <span style={{ background: '#0d47a1', color: '#ffffff', padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
          {selectedProducer.name}（{selectedProducer.yago}）
        </span>
        <button onClick={toggleMultiMode} style={{
          marginLeft: 'auto',
          background: multiMode ? '#0d47a1' : 'none',
          color: multiMode ? '#fff' : 'var(--c-text-3)',
          border: '0.5px solid var(--c-border-2)', borderRadius: 6,
          padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {multiMode ? '✕ 複数選択をやめる' : '☑ 複数日まとめて登録'}
        </button>
      </div>

      {/* 月ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <NavButton onClick={prevMonth}>◀</NavButton>
        <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{year}年{month + 1}月</span>
        <NavButton onClick={nextMonth}>▶</NavButton>
      </div>

      {loading && <Spinner />}
      {error && <ErrorMsg message={error} />}

      {!loading && !error && (
        <div style={{ border: '0.5px solid var(--c-border)', borderRadius: 12, overflow: 'hidden' }}>
          {days.map(day => {
            const dt       = new Date(year, month, day);
            const dow      = dt.getDay();
            const dateStr  = toDateStr(dt);
            const plan     = monthSchedules[day];
            const isCancel  = plan?.ステータス === STATUS.CANCEL;
            const isChanged = plan?.ステータス === STATUS.CHANGED;
            const isOpen    = openDay === dateStr;
            const isSun = dow === 0, isSat = dow === 6;
            const mc    = plan ? MARKET_COLORS[String(plan.市場番号)] : null;
            const isSelected = selectedDays.includes(day);
            const hasExisting = !!plan;

            return (
              <div key={day}>
                <div onClick={() => handleDayClick(day)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    borderTop: day > 1 ? '0.5px solid var(--c-border)' : 'none',
                    cursor: multiMode && hasExisting ? 'default' : 'pointer',
                    background: isOpen ? 'var(--c-bg-2)' : isSelected ? 'rgba(13,71,161,0.15)' : 'var(--c-bg)',
                    opacity: (isCancel || isChanged) ? 0.5 : (multiMode && hasExisting) ? 0.4 : 1,
                  }}>

                  {/* チェック */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    border: (isSelected || (plan && !isCancel && !isChanged)) ? 'none' : '0.5px solid var(--c-border-2)',
                    background: isSelected ? '#0d47a1' : (plan && !isCancel && !isChanged) ? 'var(--c-text)' : 'var(--c-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {(isSelected || (plan && !isCancel && !isChanged)) && (
                      <span style={{ color: 'var(--c-bg)', fontSize: 13 }}>✓</span>
                    )}
                  </div>

                  {/* 日・曜 */}
                  <span style={{ fontSize: 14, fontWeight: 500, width: 28, color: isSun ? '#e53935' : isSat ? '#1565c0' : 'var(--c-text)' }}>
                    {day}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--c-text-3)', width: 18 }}>
                    {DOW_JP[dow]}
                  </span>

                  {/* バッジ */}
                  <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {plan && mc && (
                      <>
                        <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, background: mc.bg, color: mc.text }}>{mc.label}</span>
                        <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, background: plan.取引区分 === '上場' ? '#0d47a1' : '#e65100', color: '#fff' }}>{plan.取引区分}</span>
                        {plan.予定トン数 && <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{plan.予定トン数}t</span>}
                        {isCancel  && <span style={{ fontSize: 11, color: '#aaa' }}>キャンセル</span>}
                        {isChanged && <span style={{ fontSize: 11, color: '#ff9800' }}>日程変更</span>}
                      </>
                    )}
                    {multiMode && !hasExisting && isSelected && (
                      <span style={{ fontSize: 11, color: '#0d47a1', fontWeight: 500 }}>選択中</span>
                    )}
                    {multiMode && hasExisting && (
                      <span style={{ fontSize: 10, color: 'var(--c-text-3)' }}>（登録済み・選択不可）</span>
                    )}
                  </div>
                </div>

                {/* 個別編集フォーム */}
                {!multiMode && isOpen && (
                  <div style={{ borderTop: '0.5px solid var(--c-border)', background: 'var(--c-bg)' }}>
                    <ScheduleForm
                      initial={editTarget}
                      onSaved={closeForm}
                      onCancel={() => { setOpenDay(null); setEditTarget(null); }}
                      onCancelPlan={closeForm}
                      onDelete={closeForm}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 複数選択モード：一括登録フォーム */}
      {multiMode && selectedDays.length > 0 && (
        <div style={{
          marginTop: 12, border: '1.5px solid #0d47a1',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 16px', background: '#0d47a1', color: '#fff',
            fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {selectedDays.sort((a, b) => a - b).map(d => `${month + 1}/${d}`).join('、')}
            <span style={{ fontSize: 12, opacity: .8 }}>（{selectedDays.length}件）をまとめて登録</span>
          </div>

          <div style={{ padding: 16 }}>
            {/* 市場 */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>市場</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {MARKETS.map(m => (
                  <button key={m.no}
                    style={radioStyle(bulkForm.市場番号 === m.no)}
                    onClick={() => setBulkForm(f => ({ ...f, 市場番号: m.no }))}>
                    {m.name.replace('魚市場', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* 取引区分 */}
            {bulkMarket && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>取引区分</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {bulkMarket.canJoto && (
                    <button style={radioStyle(bulkForm.取引区分 === '上場')}
                      onClick={() => setBulkForm(f => ({ ...f, 取引区分: '上場' }))}>上場</button>
                  )}
                  {bulkMarket.canSotai && (
                    <button style={radioStyle(bulkForm.取引区分 === '相対', '#e65100')}
                      onClick={() => setBulkForm(f => ({ ...f, 取引区分: '相対' }))}>相対</button>
                  )}
                </div>
              </div>
            )}

            {/* 予定トン数 */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>予定トン数（t）</label>
              <input type="number" step="0.1" min="0" placeholder="例：12.5"
                value={bulkForm.予定トン数}
                onChange={e => setBulkForm(f => ({ ...f, 予定トン数: e.target.value }))}
                style={{ ...inputStyle, width: 140 }} />
            </div>

            {/* 生簀番号 */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>生簀番号</label>
              <input type="text" placeholder="例：3号生簀"
                value={bulkForm.生簀番号}
                onChange={e => setBulkForm(f => ({ ...f, 生簀番号: e.target.value }))}
                style={inputStyle} />
            </div>

            {/* メモ */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>メモ</label>
              <input type="text" placeholder="任意"
                value={bulkForm.メモ}
                onChange={e => setBulkForm(f => ({ ...f, メモ: e.target.value }))}
                style={inputStyle} />
            </div>

            {bulkError && <div style={{ color: '#e53935', fontSize: 12, marginBottom: 10 }}>⚠ {bulkError}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleBulkSave} disabled={bulkSaving} style={{
                flex: 1, background: '#0d47a1', color: '#fff',
                border: 'none', borderRadius: 8, padding: '10px',
                fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {bulkSaving ? '登録中…' : `${selectedDays.length}件まとめて登録`}
              </button>
              <button onClick={() => { setSelectedDays([]); setShowBulkForm(false); }} style={{
                background: 'none', border: '0.5px solid var(--c-border-2)',
                borderRadius: 8, padding: '10px 16px',
                fontSize: 13, cursor: 'pointer', color: 'var(--c-text-3)', fontFamily: 'inherit',
              }}>選択解除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}