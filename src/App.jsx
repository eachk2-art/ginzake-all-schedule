import { useState } from 'react';
import DayView      from './pages/DayView';
import WeekView     from './pages/WeekView';
import CalendarView from './pages/CalendarView';
import RegisterView from './pages/RegisterView';
import SettingsView from './pages/SettingsView';

const TABS = [
  { id: 'day',      label: '当日',  icon: '📅' },
  { id: 'week',     label: '週',    icon: '📆' },
  { id: 'calendar', label: '暦',    icon: '🗓' },
  { id: 'register', label: '登録',  icon: '✏️' },
  { id: 'settings', label: '設定',  icon: '⚙️' },
];

export default function App() {
  const [activeTab, setActiveTab]   = useState('day');
  const [jumpDate, setJumpDate]     = useState(null);

  function gotoDay(date) {
    setJumpDate(date);
    setActiveTab('day');
  }

  const content = {
    day:      <DayView initialDate={jumpDate} onDateConsumed={() => setJumpDate(null)} />,
    week:     <WeekView onGotoDay={gotoDay} />,
    calendar: <CalendarView onGotoDay={gotoDay} />,
    register: <RegisterView />,
    settings: <SettingsView />,
  }[activeTab];

  return (
    <div style={{
      maxWidth: 680, margin: '0 auto',
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--c-bg)',
    }}>
      <header style={{
        padding: '12px 16px 0',
        background: 'var(--c-bg)',
        borderBottom: '0.5px solid var(--c-border)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-3)', marginBottom: 8 }}>
          ギンザケ水揚げ予定
        </div>
        <nav style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '8px 14px', fontSize: 13, cursor: 'pointer',
              color: activeTab === t.id ? 'var(--c-text)' : 'var(--c-text-3)',
              background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--c-text)' : '2px solid transparent',
              fontWeight: activeTab === t.id ? 500 : 400,
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {content}
      </main>
    </div>
  );
}