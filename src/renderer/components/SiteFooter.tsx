import React from 'react';

const footerLinks = [
  {
    label: 'LinkedIn',
    detail: 'devsan11',
    href: 'https://www.linkedin.com/in/devsan11/',
  },
  {
    label: 'GitHub',
    detail: '@AlanSan1195',
    href: 'https://github.com/AlanSan1195',
  },
  {
    label: 'Repositorio',
    detail: 'machtobs',
    href: 'https://github.com/AlanSan1195/machtobs',
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative border-t border-paper/15 bg-paper/[0.015]">
      <span
        className="absolute -top-px left-5 h-px w-20 bg-primary sm:left-8"
        aria-hidden="true"
      />

      <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(34rem,1.3fr)] lg:items-end">
        <div>
          <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-paper/40">
            hecho con <span aria-label="amor por los videojuegos">🎮</span> por
          </p>
          <p
            className="font-display text-[clamp(2.25rem,5vw,4.5rem)] font-black uppercase leading-[0.85] tracking-[-0.055em] text-paper"
            style={{ fontStretch: '125%' }}
          >
            Alan <span className="text-outline-footer">San</span>
          </p>
        </div>

        <nav
          className="grid border-l border-t border-paper/15 sm:grid-cols-3"
          aria-label="Enlaces de Alan San"
        >
          {footerLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="group relative min-w-0 border-b border-r border-paper/15 px-4 py-4 transition-colors hover:bg-primary hover:text-ink focus-visible:z-10 sm:py-5"
            >
              <span className="mb-2 flex items-center justify-between gap-3 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-paper/40 transition-colors group-hover:text-ink/60">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span
                  aria-hidden="true"
                  className="text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                >
                  ↗
                </span>
              </span>
              <span className="block font-display text-lg font-bold uppercase tracking-tight text-paper transition-colors group-hover:text-ink">
                {link.label}
              </span>
              <span className="mt-1 block truncate font-mono text-[0.6rem] text-paper/35 transition-colors group-hover:text-ink/65">
                {link.detail}
              </span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
