import React from 'react';
import { useAppStore } from '../store';
import { IconCpu, IconTv, Section } from './ui';

const targets = [
  { id: 'pc', label: 'pc', icon: IconCpu },
  { id: 'console', label: 'consola', icon: IconTv },
] as const;

export function SourceTargetSelector() {
  const { analysisTarget, setAnalysisTarget } = useAppStore();

  return (
    <Section title="fuente" icon={<span className="text-xs">[3]</span>} subtitle="Que vas a transmitir: tu PC, o una consola capturada con tarjeta capturadora.">
      <div className="grid grid-cols-2 gap-3">
        {targets.map((t) => {
          const selected = analysisTarget === t.id;
          const Icon = t.icon;
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => setAnalysisTarget(t.id)}
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
              <span className="text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}
