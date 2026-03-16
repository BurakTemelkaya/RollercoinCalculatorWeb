import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n'
import App from './App.tsx'

import { BrowserRouter } from 'react-router-dom'

function normalizeInitialUrl() {
  const l = window.location
  let pathname = l.pathname
  let search = l.search
  let hash = l.hash

  // Restore clean URL when arriving from 404.html redirect (/?/path format)
  if (search && search.indexOf('?/') === 0) {
    const decoded = search
      .slice(1)
      .split('&')
      .map((segment) => segment.replace(/~and~/g, '&'))
      .join('?')

    const restored = pathname.slice(0, -1) + decoded + hash
    const restoredUrl = new URL(restored, l.origin)
    pathname = restoredUrl.pathname
    search = restoredUrl.search
    hash = restoredUrl.hash
  }

  // Canonicalize trailing slash for non-root paths (/tr/ -> /tr)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.replace(/\/+$/, '')
  }

  const current = l.pathname + l.search + l.hash
  const target = pathname + search + hash
  if (target !== current) {
    window.history.replaceState(null, '', target)
  }
}

normalizeInitialUrl()

const container = document.getElementById('root')!

createRoot(container).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
)

