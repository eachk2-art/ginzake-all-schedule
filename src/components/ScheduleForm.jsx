import { useState } from 'react';
import { PRODUCERS, MARKETS } from '../lib/constants';
import { PrimaryButton, GhostButton } from './UI';
import * as api from '../lib/api';

export default function ScheduleForm({ initial, onSaved, onCancel, onCancelPlan, onDelete }) {
  const isEdit = !!initial?.予定ID;

  const [form, setForm] = useState({
    水揚日:     initial?.水揚日_str || '',
    生産者番号: initial?.生産者番号 || '',
    市場番号:   initial?.市場番号 || '',
    取引区分:   initial?.取引区分 || '上場',
    予定トン数: initial?.予定トン数 || '',
    生簀番号:   initial?.生簀番号 || '',
    メモ:       initial?.メモ || '',
  });
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [showDateChange, setShowDateChange] = useState(false);
  const [newDate, setNewDate]             = useState('');

  const market = MARKETS.find(m => m.no === String(form.市場番号));

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function getOperator() {
    return localStorage.getItem('ginzake_operator') || '';
  }

  async function handleSave() {
    if (!form.水揚日 || !form.生産者番号 || !form.市場番号) {
      setError('水揚日・生産者・市場は必須です');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const operator = getOperator();
      if (isEdit) {
        await api.updateSchedule({ 予定ID: initial.予定ID, ...form, 操作者: operator });
      } else {
        await api.addSchedule({ ...form, 操作者: operator });
      }
      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!confirm('この予定をキャンセルにしますか？')) return;
    setSaving(true);
    try {
      await api.cancelSchedule(initial.予定ID, getOperator());
      onCancelPlan?.();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleUncancel() {
    if (!confirm('キャンセルを取り消して「予定」に戻しますか？')) return;
    setSaving(true);
    try {
      await api.uncancelSchedule(initial.予定ID, getOperator());
      onSaved?.();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm('この予定を削除しますか？（取り消せません）')) return;
    setSaving(true);
    try {
      await api.deleteSchedule(initial.予定ID, getOperator());
      onDelete?.();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDateChange() {
    if (!newDate) {
      setError('変更先の日付を入力してください');
      return;
    }
    if (newDate === form.水揚日) {
      setError('同じ日付には変更できません');
      return;
    }
    if (!confirm(`${form.水揚日} → ${newDate} に日程変更しますか？`)) return;
    setSaving(true);
    setError('');
    try {
      await api.changeDateSchedule(initial.予定ID, newDate, getOperator());
      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const labelStyle = { fontSize: 11, color: 'var(--c-text-3)', marginBottom: 4, display: 'block' };
  const fieldStyle = { marginBottom: 12 };
  const radioStyle = (active, color) => ({
    padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
    border: active ? `1.5px solid ${color || '#378ADD'}` : '0.5px solid var(--c-border-2)',
    background: active ? (color ? '#e65100' : '#0d47a1') : 'none',
    color: active ? '#ffffff' : 'var(--c-text)',
    fontFamily: 'inherit',
  });
  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    border: '0.5px solid var(--c-border-2)', borderRadius: 8,
    background: 'var(--c-bg)', color: 'var(--c-text)', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 16 }}>

      {/* 水揚日 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>水揚日</label>
        {isEdit ? (
          <div style={{ fontSize: 14, fontWeight: 500 }}>{initial?.水揚日_str}</div>
        ) : (
          <input type="date" value={form.水揚日}
            onChange={e => set('水揚日', e.target.value)} style={inputStyle} />
        )}
      </div>

      {/* 生産者 */}
      {isEdit ? (
        <div style={fieldStyle}>
          <label style={labelStyle}>生産者</label>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{initial?.生産者名}
            <span style={{ fontSize: 11, color: 'var(--c-text-3)', marginLeft: 6 }}>{initial?.屋号}</span>
          </div>
        </div>
      ) : (
        <div style={fieldStyle}>
          <label style={labelStyle}>生産者</label>
          <select value={form.生産者番号} onChange={e => set('生産者番号', e.target.value)}
            style={{ ...inputStyle, appearance: 'none' }}>
            <option value="">選択してください</option>
            {PRODUCERS.map(p => (
              <option key={p.no} value={p.no}>{p.name}（{p.yago}）</option>
            ))}
          </select>
        </div>
      )}

      {/* 市場 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>市場</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MARKETS.map(m => (
            <button key={m.no}
              style={radioStyle(String(form.市場番号) === m.no)}
              onClick={() => set('市場番号', m.no)}>
              {m.name.replace('魚市場', '')}
            </button>
          ))}
        </div>
      </div>

      {/* 取引区分 */}
      {market && (
        <div style={fieldStyle}>
          <label style={labelStyle}>取引区分</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {market.canJoto && (
              <button style={radioStyle(form.取引区分 === '上場')}
                onClick={() => set('取引区分', '上場')}>上場</button>
            )}
            {market.canSotai && (
              <button style={radioStyle(form.取引区分 === '相対', '#e65100')}
                onClick={() => set('取引区分', '相対')}>相対</button>
            )}
          </div>
        </div>
      )}

      {/* 予定トン数 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>予定トン数（t）</label>
        <input type="number" step="0.1" min="0" placeholder="例：12.5"
          value={form.予定トン数} onChange={e => set('予定トン数', e.target.value)}
          style={{ ...inputStyle, width: 140 }} />
      </div>

      {/* 生簀番号 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>生簀番号</label>
        <input type="text" placeholder="例：3号生簀"
          value={form.生簀番号} onChange={e => set('生簀番号', e.target.value)}
          style={inputStyle} />
      </div>

      {/* メモ */}
      <div style={fieldStyle}>
        <label style={labelStyle}>メモ</label>
        <input type="text" placeholder="任意"
          value={form.メモ} onChange={e => set('メモ', e.target.value)}
          style={inputStyle} />
      </div>

      {/* 日程変更パネル */}
      {isEdit && showDateChange && (
        <div style={{
          marginBottom: 12, padding: 12,
          border: '1px solid #e65100', borderRadius: 8,
          background: 'var(--c-bg-2)',
        }}>
          <label style={{ ...labelStyle, color: '#e65100' }}>変更先の日付</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={newDate}
              onChange={e => setNewDate(e.target.value)}
              style={{ ...inputStyle, width: 'auto', flex: 1 }} />
            <button onClick={handleDateChange} disabled={saving} style={{
              background: '#e65100', color: '#fff',
              border: 'none', borderRadius: 8, padding: '8px 14px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>
              {saving ? '処理中…' : '変更確定'}
            </button>
            <button onClick={() => { setShowDateChange(false); setNewDate(''); }} style={{
              background: 'none', border: '0.5px solid var(--c-border-2)',
              borderRadius: 8, padding: '8px 10px',
              fontSize: 13, cursor: 'pointer', color: 'var(--c-text-3)', fontFamily: 'inherit',
            }}>✕</button>
          </div>
        </div>
      )}

      {error && <div style={{ color: '#e53935', fontSize: 12, marginBottom: 10 }}>⚠ {error}</div>}

      {/* アクションボタン */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </PrimaryButton>
        {isEdit && (
          <>
            <GhostButton onClick={() => { setShowDateChange(!showDateChange); setError(''); }}>
              📅 日程変更
            </GhostButton>
            {initial?.ステータス === 'キャンセル' ? (
              <GhostButton onClick={handleUncancel}>キャンセル取消</GhostButton>
            ) : (
              <GhostButton onClick={handleCancel} danger>キャンセルにする</GhostButton>
            )}
            <GhostButton onClick={handleDelete} danger>削除</GhostButton>
          </>
        )}
        <GhostButton onClick={onCancel}>閉じる</GhostButton>
      </div>
    </div>
  );
}