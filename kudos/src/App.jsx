import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Compose from './pages/Compose.jsx';
import Sent from './pages/Sent.jsx';
import View from './pages/View.jsx';
import Forward from './pages/Forward.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const { pathname } = useLocation();
  const onView = pathname.startsWith('/k/');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-navy/10 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-extrabold text-navy"
            aria-label="Kudos home"
          >
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal text-white text-lg"
            >
              ♥
            </span>
            <span className="tracking-tight">Kudos</span>
          </Link>
          {!onView && (
            <Link
              to="/"
              className="text-sm text-navy/70 hover:text-teal font-semibold"
            >
              Send a kudos
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Compose />} />
          <Route path="/sent" element={<Sent />} />
          <Route path="/k/:kudosId" element={<View />} />
          <Route path="/forward/:parentId" element={<Forward />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="border-t border-navy/10 bg-white/60 py-6 mt-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-navy/60 space-y-1">
          <p>
            Kudos is 100% anonymous. AI checks every message to keep it kind.
          </p>
          <p>
            A gift from the team at{' '}
            <a
              href="https://leaderreps.com"
              className="font-semibold text-teal hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              LeaderReps
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
