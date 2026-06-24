import { useState } from 'react';
import { PRODUCERS, MARKETS, MARKET_COLORS } from '../lib/constants';

export default function SettingsView() {
  const [operator, setOperator] = useState(localStorage.getItem('ginzake_operator') || '');
  const [gasUrl, setGasUrl]     = useState(import.meta.env.VITE_GAS_URL || '');
  const [saved, setSaved]       = useState(false);

  function save() {
    localStorage.setItem('ginzake_operator', operator);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const sectionStyle = { marginBottom: 20 };
  const labelStyle   = { fontSize: 11, color: 'var(--c-text-3)', marginBottom: 6, letterSpacing: '.04em', display: 'block' };
  const rowStyle     = {
    display: 'flex', alignItems: 'center', padding: '8px 12px',
    background: 'var(--c-bg)', border: '0.5px solid var(--c-border)',
    borderRadius: 8, marginBottom: 3, gap: 8, fontSize: 13,
  };
  const inputStyle   = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    border: '0.5px solid var(--c-border-2)', borderRadius: 8,
    background: 'var(--c-bg)', color: 'var(--c-text)',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      {/* 操作者名 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>操作者名（変更ログに記録されます）</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={operator} onChange={e => setOperator(e.target.value)}
            placeholder="お名前を入力"
            style={{ ...inputStyle }}
          />
          <button onClick={save} style={{
            background: 'var(--c-text)', color: 'var(--c-bg)',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}>
            {saved ? '✓ 保存' : '保存'}
          </button>
        </div>
      </div>

      {/* GAS URL */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Google Apps Script URL</label>
        <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginBottom: 6 }}>
          .env ファイルの VITE_GAS_URL で設定します。現在の値：
        </div>
        <div style={{ fontSize: 11, padding: '6px 10px', background: 'var(--c-bg-2)', borderRadius: 6, wordBreak: 'break-all' }}>
          {import.meta.env.VITE_GAS_URL || '（未設定）'}
        </div>
      </div>

      {/* 生産者一覧 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>生産者（番号順）</label>
        {PRODUCERS.map(p => (
          <div key={p.no} style={rowStyle}>
            <span style={{ fontSize: 11, color: 'var(--c-text-3)', width: 24 }}>{p.no}</span>
            <span style={{ fontWeight: 500 }}>{p.name}</span>
            <span style={{ fontSize: 11, color: 'var(--c-text-3)', marginLeft: 4 }}>{p.yago}</span>
          </div>
        ))}
      </div>

      {/* 市場一覧 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>市場</label>
        {MARKETS.map(m => {
          const mc = MARKET_COLORS[m.no];
          return (
            <div key={m.no} style={rowStyle}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: mc.dot, flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>{m.name}</span>
              <span style={{ fontSize: 11, color: 'var(--c-text-3)', marginLeft: 'auto' }}>
                {[m.canJoto && '上場', m.canSotai && (m.sotaiDefault ? '相対（デフォルト）' : '相対')].filter(Boolean).join('・')}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: 'var(--c-text-3)', lineHeight: 1.8 }}>
        生産者・市場のマスターデータはスプレッドシートの「マスター_生産者」「マスター_市場」シートで管理します。
      </div>
    </div>
  );
}
