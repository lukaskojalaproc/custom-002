import { useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Building2,
  FileStack,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, Button } from './ui';
import { NewTenderModal } from './NewTenderModal';

const NAV = [
  { to: '/', label: 'Apžvalga', icon: LayoutDashboard, end: true },
  { to: '/pirkimai', label: 'Pirkimai', icon: FileStack },
  { to: '/rangovai', label: 'Rangovai', icon: Building2 },
  { to: '/analitika', label: 'Istorinė analitika', icon: BarChart3 },
  { to: '/apie', label: 'Pirkimo algoritmas', icon: BookOpen },
  { to: '/nustatymai', label: 'Nustatymai', icon: Settings },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? 'logo-light' : ''}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#029F74" />
        <path d="M9 23V9h8.2a5.2 5.2 0 010 10.4H13" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <div className="logo-word">ProcFly</div>
        <div className="logo-sub">Generalinė ranga</div>
      </div>
    </div>
  );
}

function GlobalSearch() {
  const { state } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const tenders = state.tenders
      .filter((t) => `${t.name} ${t.code} ${t.location}`.toLowerCase().includes(s))
      .slice(0, 5)
      .map((t) => ({ key: t.id, label: t.name, sub: t.code, to: `/pirkimai/${t.id}` }));
    const contractors = state.contractors
      .filter((c) => `${c.name} ${c.city}`.toLowerCase().includes(s))
      .slice(0, 5)
      .map((c) => ({ key: c.id, label: c.name, sub: c.city, to: `/rangovai/${c.id}` }));
    return [...tenders, ...contractors];
  }, [q, state]);

  return (
    <div className="search" ref={ref}>
      <Search size={16} />
      <input
        placeholder="Ieškoti pirkimų ir rangovų…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        aria-label="Paieška"
      />
      {open && q.trim().length >= 2 && (
        <div className="search-pop">
          {results.length === 0 && <div className="search-empty">Nieko nerasta</div>}
          {results.map((r) => (
            <button
              key={r.key}
              type="button"
              onMouseDown={() => {
                nav(r.to);
                setQ('');
                setOpen(false);
              }}
            >
              <span>{r.label}</span>
              <span className="muted">{r.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { state, setUser } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const user = state.user!;

  return (
    <div className={`app ${menuOpen ? 'menu-open' : ''}`}>
      <aside className="sidebar">
        <Logo light />
        <nav className="nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-user">
            <Avatar name={user.name} size={34} />
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          </div>
          <button type="button" className="nav-item" onClick={() => setUser(null)}>
            <LogOut size={18} />
            <span>Atsijungti</span>
          </button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setMenuOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label="Meniu" onClick={() => setMenuOpen((v) => !v)}>
            <Menu size={20} />
          </button>
          <GlobalSearch />
          <div className="topbar-right">
            <span className="demo-pill" title="Duomenys saugomi tik šioje naršyklėje">Demo prototipas</span>
            <Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>
              Naujas pirkimas
            </Button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      {creating && <NewTenderModal onClose={() => setCreating(false)} />}
    </div>
  );
}
