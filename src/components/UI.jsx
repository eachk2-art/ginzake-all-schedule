import { MARKET_COLORS } from '../lib/constants';

export function MarketBadge({ marketNo, small }) {
  const c = MARKET_COLORS[marketNo] || {};
  const sz = small ? { fontSize: 10, padding: '1px 5px' } : { fontSize: 11, padding: '2px 7px' };
  return (
    <span style={{
      background: c.bg, color: c.text,
      borderRadius: 20, fontWeight: 500, ...sz
    }}>
      {c.label || marketNo}
    </span>
  );
}

export function TradeBadge({ trade, small }) {
  const isJoto = trade === '上場';
  const sz = small ? { fontSize: 10, padding: '1px 5px' } : { fontSize: 11, padding: '2px 7px' };
  return (
    <span style={{
      background: isJoto ? '#E6F1FB' : '#FAEEDA',
      color: isJoto ? '#185FA5' : '#854F0B',
      borderRadius: 20, ...sz
    }}>
      {trade}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    'キャンセル': { bg: '#F1EFE8', color: '#5F5E5A' },
    '日程変更':   { bg: '#FAEEDA', color: '#854F0B' },
    '予定':       { bg: '#EAF3DE', color: '#3B6D11' },
  };
  const s = map[status] || map['予定'];
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 10, padding: '2px 7px', borderRadius: 20
    }}>
      {status}
    </span>
  );
}

export function NavButton({ onClick, children, active }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--c-text)' : 'none',
      color: active ? 'var(--c-bg)' : 'var(--c-text-2)',
      border: '0.5px solid var(--c-border-2)',
      borderRadius: 8, padding: '5px 12px',
      fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    }}>
      {children}
    </button>
  );
}

export function PrimaryButton({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? 'var(--c-border)' : 'var(--c-text)',
      color: 'var(--c-bg)',
      border: 'none', borderRadius: 8, padding: '9px 18px',
      fontSize: 13, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit', flex: 1,
    }}>
      {children}
    </button>
  );
}

export function GhostButton({ onClick, children, danger }) {
  return (
    <button onClick={onClick} style={{
      background: 'none',
      color: danger ? '#A32D2D' : 'var(--c-text-2)',
      border: `0.5px solid ${danger ? '#F0997B' : 'var(--c-border-2)'}`,
      borderRadius: 8, padding: '8px 14px',
      fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    }}>
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-3)', fontSize: 13 }}>
      読み込み中…
    </div>
  );
}

export function ErrorMsg({ message }) {
  return (
    <div style={{
      background: '#FCEBEB', color: '#A32D2D',
      padding: '10px 14px', borderRadius: 8, fontSize: 13, margin: '8px 0'
    }}>
      ⚠ {message}
    </div>
  );
}

export function EmptyMsg({ children }) {
  return (
    <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--c-text-3)' }}>
      {children}
    </div>
  );
}
