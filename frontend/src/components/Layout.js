import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Quick Actions FAB ────────────────────────────────────────────────────────
function QuickActionsFAB({ quickActions }) {
  const [open, setOpen] = useState(false);
  if (!quickActions?.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2 mb-2 animate-slide-up">
          {quickActions.map((action, i) => (
            <button key={i} onClick={() => { action.onClick(); setOpen(false); }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-glass transition-all duration-200 hover:scale-105"
              style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', minWidth: '160px' }}>
              <span className="text-indigo-400">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)}
        className={`w-13 h-13 rounded-full flex items-center justify-center shadow-glow transition-all duration-300 ${open ? 'rotate-45' : ''}`}
        style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

// ─── Phase badge ──────────────────────────────────────────────────────────────
function PhaseBadge() {
  const { token } = useAuth();
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/coordinator/phase`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPhase(data); })
      .catch(() => {});
  }, [token]);

  if (!phase) return null;
  const current = phase.phases?.find(p => p.number === phase.currentPhase);

  return (
    <div className="phase-pill mb-4 justify-center">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3" />
      </svg>
      {current?.name || `Phase ${phase.currentPhase}`}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children, navItems, title, quickActions }) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const displayName = user?.name || user?.leaderName || user?.teamCode || '';
  const displaySub  = user?.email || (user?.teamCode ? `Team ${user.teamCode}` : '');
  const isCoordinator = user?.role === 'COORDINATOR';

  const roleColors = {
    STUDENT:    { dot: 'bg-sky-400',     label: 'Student Team' },
    MENTOR:     { dot: 'bg-emerald-400', label: 'Mentor' },
    COORDINATOR:{ dot: 'bg-indigo-400',  label: 'Coordinator' },
  };
  const roleInfo = roleColors[user?.role] || { dot: 'bg-slate-400', label: '' };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8fafc' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 md:hidden bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 flex-shrink-0 flex flex-col fixed md:relative inset-y-0 left-0 z-30 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>

        {/* Brand */}
        <div className="p-5" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow-sm"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-slate-800 leading-tight">CapTrack</h1>
              <p className="text-xs text-slate-400 mt-0.5">AY 2025–2026</p>
            </div>
          </div>

          {/* Role + title */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`} />
            <span className="text-xs text-slate-500 font-medium">{roleInfo.label}</span>
          </div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{title}</div>

          {/* Phase badge (coordinator only) */}
          {isCoordinator && (
            <div className="mt-3">
              <PhaseBadge />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {item.icon}
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                  style={{ background: '#ef4444', minWidth: 20, textAlign: 'center' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-slate-800 font-semibold truncate">{displayName}</div>
              <div className="text-xs text-slate-500 truncate">{displaySub}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-sm py-2 rounded-lg transition-colors duration-200 text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold text-slate-800 text-sm">{title}</span>
        <div className="w-8" />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#f8fafc' }}>
        <div className="md:hidden h-14" />
        {children}
      </main>

      {/* Quick Actions FAB */}
      <QuickActionsFAB quickActions={quickActions} />
    </div>
  );
}
