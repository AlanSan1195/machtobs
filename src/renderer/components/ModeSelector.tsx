import React from 'react';
import { useAppStore } from '../store';
import { IconClapperboard, IconTv, IconVideo, Section } from './ui';

const modes = [
  { id: 'stream_record', label: 'stream + rec', icon: IconVideo },
  { id: 'stream_only', label: 'solo stream', icon: IconTv },
  { id: 'record_only', label: 'solo grabacion', icon: IconClapperboard },
] as const;

export function ModeSelector() {
  const { mode, setMode } = useAppStore();

  return (
    <Section title="modo" icon={<span className="text-xs">[1]</span>}>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((m) => {
          const selected = mode === m.id;
          const Icon = m.icon;
          return (
            <button
              type="button"
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={selected}
              className={`group flex flex-col items-center gap-3 border p-5 transition-colors duration-200 ${
                selected
                  ? 'border-primary/70 bg-primary/[0.07] text-primary'
                  : 'border-paper/15 text-paper/50 hover:border-paper/40 hover:text-paper'
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center border transition-colors ${
                  selected
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-paper/15 text-paper/50 group-hover:text-paper'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] leading-tight">{m.label}</span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}
