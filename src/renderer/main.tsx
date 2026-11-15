import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/index.css';

const root = document.getElementById('root')!;

async function renderCurrentRoute() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const Page = normalizedPath === '/configurador'
    ? (await import('./App')).default
    : normalizedPath === '/como-configurar-obs'
      ? (await import('../seo/ObsBeginnerGuide')).ObsBeginnerGuide
    : (await import('./LandingPage')).LandingPage;
  const page = (
    <React.StrictMode>
      <Page />
    </React.StrictMode>
  );

  if (root.hasChildNodes()) {
    hydrateRoot(root, page);
  } else {
    createRoot(root).render(page);
  }
}

void renderCurrentRoute();
