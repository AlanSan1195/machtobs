import { useAppStore } from '../store';

export function SiteFooter() {
  const { obsConnected, obsMessage } = useAppStore();

  return (
    <footer className="relative border-t border-paper/15 bg-paper/[0.015]">
      <span
        className="absolute -top-px left-5 h-px w-20 bg-primary sm:left-8"
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-5 py-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] sm:px-8">
        <span aria-hidden="true" className="flex shrink-0 items-center">
          <span
            className={`inline-block h-1.5 w-1.5 ${
              obsConnected ? 'animate-pulse-dot bg-primary' : 'bg-danger'
            }`}
          />
        </span>
        <span className="hidden text-paper/40 sm:inline">machtobs</span>
        <span className="truncate text-paper/60 normal-case tracking-normal">{obsMessage}</span>

        <span className="mx-2 text-paper/20" aria-hidden="true">·</span>

        <p className="text-[0.6rem] text-paper/40">
          por{' '}
          <a
            href="https://github.com/AlanSan1195"
            target="_blank"
            rel="noreferrer"
            className="text-paper/60 transition-colors hover:text-primary"
          >
            Alan San
          </a>
        </p>

        <a
          href="https://github.com/AlanSan1195/machtobs"
          target="_blank"
          rel="noreferrer"
          aria-label="Repositorio del proyecto"
          className="ml-auto text-paper/40 transition-colors hover:text-primary"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
