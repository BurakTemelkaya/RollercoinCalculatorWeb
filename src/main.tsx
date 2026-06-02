import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

function normalizeInitialUrl() {
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('ReactSnap')) {
    console.error = () => {};
  }

  const l = window.location
  let pathname = l.pathname
  let search = l.search
  let hash = l.hash

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

  // Trailing slash kaldır (root "/" hariç)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.replace(/\/+$/, '');
  }

  const current = l.pathname + l.search + l.hash
  const target = pathname + search + hash
  if (target !== current) {
    window.history.replaceState(null, '', target)
  }
}

normalizeInitialUrl()

sessionStorage.removeItem('rollercoin_chunk_reload');

const container = document.getElementById('root')!

// Pre-rendered HTML sadece SEO crawlerlar için kullanılır.
// Hydration yerine createRoot kullanarak React #418 hatasını önlüyoruz.
// Crawlerlar JS çalıştırmadığı için statik HTML'i zaten okuyabilir.
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
  </StrictMode>
);