import React from 'react';

type IconProps = {
  className?: string;
};

function createIcon(paths: React.ReactNode, displayName: string) {
  function Icon({ className = 'h-5 w-5' }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const IconVideo = createIcon(
  <>
    <path d="m16 10 5-3v10l-5-3" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </>,
  'IconVideo',
);

export const IconTv = createIcon(
  <>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <polyline points="17 2 12 7 7 2" />
  </>,
  'IconTv',
);

export const IconClapperboard = createIcon(
  <>
    <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
    <path d="m6.2 5.3 3.1 3.9" />
    <path d="m12.4 3.4 3.1 4" />
    <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </>,
  'IconClapperboard',
);

export const IconTwitch = createIcon(
  <>
    <path d="M21 2H3v16h5v4l4-4h5l4-4V2z" />
    <path d="M11 11V7" />
    <path d="M16 11V7" />
  </>,
  'IconTwitch',
);

export const IconYoutube = createIcon(
  <>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </>,
  'IconYoutube',
);

export const IconSparkles = createIcon(
  <>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </>,
  'IconSparkles',
);

export const IconCpu = createIcon(
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M15 2v2" />
    <path d="M15 20v2" />
    <path d="M2 15h2" />
    <path d="M2 9h2" />
    <path d="M20 15h2" />
    <path d="M20 9h2" />
    <path d="M9 2v2" />
    <path d="M9 20v2" />
  </>,
  'IconCpu',
);

export const IconMonitor = createIcon(
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </>,
  'IconMonitor',
);

export const IconMemory = createIcon(
  <>
    <path d="M6 19v-3" />
    <path d="M10 19v-3" />
    <path d="M14 19v-3" />
    <path d="M18 19v-3" />
    <path d="M8 11V9" />
    <path d="M16 11V9" />
    <path d="M12 11V9" />
    <path d="M2 15h20" />
    <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z" />
  </>,
  'IconMemory',
);

export const IconHardDrive = createIcon(
  <>
    <line x1="22" y1="12" x2="2" y2="12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    <line x1="6" y1="16" x2="6.01" y2="16" />
    <line x1="10" y1="16" x2="10.01" y2="16" />
  </>,
  'IconHardDrive',
);

export const IconMic = createIcon(
  <>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </>,
  'IconMic',
);

export const IconPlug = createIcon(
  <>
    <path d="M12 22v-5" />
    <path d="M9 8V2" />
    <path d="M15 8V2" />
    <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
  </>,
  'IconPlug',
);

export const IconUpload = createIcon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>,
  'IconUpload',
);

export const IconCheck = createIcon(
  <polyline points="20 6 9 17 4 12" />,
  'IconCheck',
);

export const IconAlert = createIcon(
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>,
  'IconAlert',
);

export const IconX = createIcon(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>,
  'IconX',
);

export const IconRefresh = createIcon(
  <>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </>,
  'IconRefresh',
);

export const IconSliders = createIcon(
  <>
    <line x1="21" y1="4" x2="14" y2="4" />
    <line x1="10" y1="4" x2="3" y2="4" />
    <line x1="21" y1="12" x2="12" y2="12" />
    <line x1="8" y1="12" x2="3" y2="12" />
    <line x1="21" y1="20" x2="16" y2="20" />
    <line x1="12" y1="20" x2="3" y2="20" />
    <line x1="14" y1="2" x2="14" y2="6" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="16" y1="18" x2="16" y2="22" />
  </>,
  'IconSliders',
);

export const IconActivity = createIcon(
  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  'IconActivity',
);

export function Spinner({ className = 'h-5 w-5' }: IconProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${className}`}
    />
  );
}

type SectionProps = {
  title: string;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
};

export function Section({ title, icon, subtitle, action, accent = false, children }: SectionProps) {
  const titleId = React.useId();
  const railColumns = 'grid-cols-[2rem_minmax(0,1fr)] sm:grid-cols-[2.5rem_minmax(0,1fr)]';

  return (
    <section
      aria-labelledby={titleId}
      className={`group/section relative border bg-background/45 transition-colors ${
        accent ? 'border-primary/45 bg-primary/[0.025]' : 'border-paper/15'
      }`}
    >
      <span
        className={`pointer-events-none absolute -top-px left-8 z-10 h-px w-12 sm:left-10 ${
          accent ? 'bg-primary' : 'bg-paper/55'
        }`}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute -bottom-[3px] -right-[3px] z-10 h-[5px] w-[5px] ${
          accent ? 'bg-primary' : 'bg-paper/35'
        }`}
        aria-hidden="true"
      />

      <header
        className={`grid border-b ${
          action ? 'sm:grid-cols-[minmax(0,1fr)_auto]' : ''
        } ${
          accent ? 'border-primary/25 bg-primary/[0.045]' : 'border-paper/10 bg-paper/[0.018]'
        }`}
      >
        <div className={`grid min-w-0 ${railColumns}`}>
          <span
            className={`flex items-center justify-center border-r ${
              accent ? 'border-primary/25' : 'border-paper/10'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 transition-colors ${
                accent
                  ? 'bg-primary'
                  : 'bg-paper/35 group-hover/section:bg-paper/60'
              }`}
              aria-hidden="true"
            />
          </span>
          <div className="flex min-w-0 items-center gap-3 px-3.5 py-3 sm:px-4">
            {icon && (
              <span className={`shrink-0 ${accent ? 'text-primary' : 'text-paper/45'}`}>
                {icon}
              </span>
            )}
            <h3
              id={titleId}
              className={`truncate font-mono text-[0.68rem] font-medium uppercase tracking-[0.18em] ${
                accent ? 'text-primary' : 'text-paper'
              }`}
            >
              {title}
            </h3>
            <span
              className={`hidden h-px min-w-5 flex-1 sm:block ${
                accent ? 'bg-primary/20' : 'bg-paper/10'
              }`}
              aria-hidden="true"
            />

          </div>
        </div>
        {action && (
          <div
            className={`flex flex-wrap items-center gap-2 border-t px-3.5 py-2.5 sm:border-l sm:border-t-0 sm:px-4 ${
              accent ? 'border-primary/25' : 'border-paper/10'
            }`}
          >
            {action}
          </div>
        )}
      </header>

      {subtitle && (
        <div
          className={`grid border-b ${
            accent ? 'border-primary/20' : 'border-paper/10'
          } ${railColumns}`}
        >
          <span
            className={`flex justify-center border-r pt-2.5 font-mono text-[0.65rem] ${
              accent ? 'border-primary/20 text-primary/70' : 'border-paper/10 text-paper/25'
            }`}
            aria-hidden="true"
          >
            ↳
          </span>
          <div className="px-3.5 py-2.5 font-mono text-[0.625rem] leading-relaxed tracking-[0.045em] text-paper/48 sm:px-4">
            {subtitle}
          </div>
        </div>
      )}

      <div className={`grid ${railColumns}`}>
        <span
          className={`relative border-r ${
            accent ? 'border-primary/20' : 'border-paper/10'
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute left-1/2 top-5 h-px w-2 -translate-x-1/2 ${
              accent ? 'bg-primary/50' : 'bg-paper/20'
            }`}
          />
        </span>
        <div className="min-w-0 p-4 sm:p-5">{children}</div>
      </div>
    </section>
  );
}
