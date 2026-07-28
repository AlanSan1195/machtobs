import React from 'react';
import { useAppStore } from '../store';
import { IconTwitch, IconYoutube, Section } from './ui';

const platforms = [
  {
    id: 'twitch',
    label: 'twitch',
    icon: IconTwitch,
    selectedClasses: 'border-primary/70 bg-primary/[0.07] text-primary',
    selectedIconClasses: 'border-primary/50 bg-primary/10 text-primary',
  },
  {
    id: 'youtube',
    label: 'youtube',
    icon: IconYoutube,
    selectedClasses: 'border-primary/70 bg-primary/[0.07] text-primary',
    selectedIconClasses: 'border-primary/50 bg-primary/10 text-primary',
  },
] as const;

export function PlatformSelector() {
  const { platform, setPlatform } = useAppStore();

  return (
    <Section title="plataforma" icon={<span className="text-xs">[2]</span>}>
      <div className="grid grid-cols-2 gap-3">
        {platforms.map((p) => {
          const selected = platform === p.id;
          const Icon = p.icon;
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => setPlatform(p.id)}
              aria-pressed={selected}
              className={`group flex flex-col items-center gap-3 border p-5 transition-colors duration-200 ${
                selected
                  ? p.selectedClasses
                  : 'border-paper/15 text-paper/50 hover:border-paper/40 hover:text-paper'
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center border transition-colors ${
                  selected
                    ? p.selectedIconClasses
                    : 'border-paper/15 text-paper/50 group-hover:text-paper'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em]">{p.label}</span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}
