import React, { useState } from 'react';

export type TabItem = {
  id: string;
  label: string;
  render: () => React.ReactNode;
};

export function Tabs({ items, initialId }: { items: TabItem[]; initialId?: string }) {
  const [active, setActive] = useState<string>(initialId ?? (items[0]?.id ?? ''));

  return (
    <div className="uiux-tabs" style={{ display: 'grid', gap: 8 }}>
      <div role="tablist" aria-label="UI/UX subtabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {items.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              onClick={() => setActive(t.id)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #555',
                background: isActive ? '#2a2a2a' : '#1c1c1c',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {items.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
          style={{ display: t.id === active ? 'block' : 'none' }}
        >
          {t.render()}
        </div>
      ))}
    </div>
  );
}
