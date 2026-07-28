import React from 'react';
import { useAppStore } from '../store';

export function StatusBar() {
  const { obsConnected, obsMessage } = useAppStore();

  return (
    <footer className="border-t border-paper/10">
      <div
        aria-live="polite"
        className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-5 py-3 font-mono text-[0.65rem] uppercase tracking-[0.18em]"
      >
        <span aria-hidden="true" className="flex shrink-0 items-center">
          <span
            className={`inline-block h-1.5 w-1.5 ${
              obsConnected ? 'animate-pulse-dot bg-primary' : 'bg-danger'
            }`}
          />
        </span>
        <span className="text-paper/40">match-to-obs / local</span>
        <span className="truncate text-paper/60 normal-case tracking-normal">{obsMessage}</span>
        <span className="ml-auto hidden shrink-0 text-paper/40 sm:block">
          {obsConnected ? 'ws / conectado' : 'ws / cerrado'}
        </span>
      </div>
    </footer>
  );
}
