import React from 'react';
import { Link } from 'react-router-dom';

const AVATAR_COLORS = [
  { bg: 'rgba(99,102,241,0.25)',  border: 'rgba(99,102,241,0.4)',  text: '#a5b4fc' },
  { bg: 'rgba(139,92,246,0.25)', border: 'rgba(139,92,246,0.4)',  text: '#c4b5fd' },
  { bg: 'rgba(16,185,129,0.25)', border: 'rgba(16,185,129,0.4)',  text: '#6ee7b7' },
  { bg: 'rgba(236,72,153,0.25)', border: 'rgba(236,72,153,0.4)',  text: '#f9a8d4' },
  { bg: 'rgba(245,158,11,0.25)', border: 'rgba(245,158,11,0.4)',  text: '#fcd34d' },
  { bg: 'rgba(6,182,212,0.25)',  border: 'rgba(6,182,212,0.4)',   text: '#67e8f9' },
];

const TEAM_MEMBERS = [
  { name: 'Allen',     role: 'Team Leader', team: 'Team 1' },
  { name: 'Aarya',     role: 'Member',      team: 'Team 1' },
  { name: 'Melissa',   role: 'Member',      team: 'Team 1' },
  { name: 'Riya',      role: 'Team Leader', team: 'Team 2' },
  { name: 'Pratiksha', role: 'Member',      team: 'Team 2' },
  { name: 'Sandra',    role: 'Member',      team: 'Team 2' },
];

const GUIDES = [
  { name: 'Mrs. Chetana',     title: 'Mentor' },
  { name: 'Mrs. Nupur',       title: 'Mentor' },
  { name: 'Dr. Smitha Dange', title: 'Project Coordinator' },
];

const FEATURES = [
  {
    label: 'Student Teams',
    desc: 'Submit project titles, track milestones, upload progress reports and receive mentor feedback.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
    color: 'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.3)',
    iconColor: '#a5b4fc',
  },
  {
    label: 'Mentor Reviews',
    desc: 'Review team submissions and milestones, provide feedback, and approve or reject progress.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.3)',
    iconColor: '#6ee7b7',
  },
  {
    label: 'Coordinator Oversight',
    desc: 'Assign mentors, control project phases, download Excel reports, and broadcast announcements.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.3)',
    iconColor: '#fcd34d',
  },
];

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
      <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
        style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#e2e8f0' }}>
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 600, height: 600, top: -200, left: -200, background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: 500, height: 500, bottom: -150, right: -150, background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(13,13,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm text-white leading-tight">CapTrack</div>
            <div className="text-xs" style={{ color: '#64748b' }}>Fr. CRIT · AY 2025–2026</div>
          </div>
        </div>
        <Link to="/login"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
          style={{ color: '#818cf8' }}
          onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
          onMouseLeave={e => e.currentTarget.style.color = '#818cf8'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Login
        </Link>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
            Academic Year 2025–2026
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            About This Project
          </h1>
          <p className="text-lg font-semibold mb-4" style={{ color: '#818cf8' }}>
            Capstone Project Monitoring System
          </p>
          <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color: '#94a3b8' }}>
            Built as a capstone project for Fr. CRIT, this platform streamlines student project management,
            mentor reviews, and coordinator oversight — all in one place.
          </p>
        </div>

        {/* Meet the Team */}
        <section className="mb-16">
          <SectionDivider label="Meet the Team" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEAM_MEMBERS.map((member, i) => {
              const color = AVATAR_COLORS[i];
              const isLeader = member.role === 'Team Leader';
              return (
                <div key={member.name}
                  className="flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(12px)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold mb-4"
                    style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
                    {member.name[0]}
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{member.name}</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full mb-1.5"
                    style={isLeader
                      ? { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {member.role}
                  </span>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>{member.team}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Guided By */}
        <section className="mb-16">
          <SectionDivider label="Guided By" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GUIDES.map(guide => (
              <div key={guide.name}
                className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                  {guide.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{guide.name}</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: '#6ee7b7' }}>{guide.title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Platform Features */}
        <section className="mb-16">
          <SectionDivider label="Platform Features" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.label}
                className="p-6 rounded-2xl text-center transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.border; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: f.color, border: `1px solid ${f.border}`, color: f.iconColor }}>
                  {f.icon}
                </div>
                <div className="text-white font-semibold text-sm mb-2">{f.label}</div>
                <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-8">
          <SectionDivider label="Built With" />
          <div className="flex flex-wrap justify-center gap-3">
            {['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'JWT Auth', 'REST API', 'Excel Export'].map(tech => (
              <span key={tech}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#475569' }}>
        © 2026 Capstone Project Monitoring System · Department of Computer Engineering · Fr. CRIT
      </footer>
    </div>
  );
}
