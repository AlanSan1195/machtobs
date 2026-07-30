import React from 'react';
import { useAppStore } from '../store';
import type { ConsoleModel } from '../../shared/types';
import { Section } from './ui';

const consoles: { id: ConsoleModel; label: string }[] = [
  { id: 'ps5', label: 'PS5' },
  { id: 'ps5_pro', label: 'PS5 Pro' },
  { id: 'xbox_series_x', label: 'Xbox Series X' },
  { id: 'xbox_series_s', label: 'Xbox Series S' },
  { id: 'switch', label: 'Switch' },
  { id: 'switch2', label: 'Switch 2' },
];

export function ConsoleSelector() {
  const { consoleModel, setConsoleModel } = useAppStore();

  return (
    <Section title="consola">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {consoles.map((c) => {
          const selected = consoleModel === c.id;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => setConsoleModel(c.id)}
              aria-pressed={selected}
              className={`flex items-center justify-center border px-3 py-4 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] transition-colors duration-200 ${
                selected
                  ? 'border-primary/70 bg-primary/[0.07] text-primary'
                  : 'border-paper/15 text-paper/50 hover:border-paper/40 hover:text-paper'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}
