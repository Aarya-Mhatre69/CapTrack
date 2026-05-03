import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const HomeIcon     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const TeamsIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MentorIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const MilestoneIcon= () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const AnnIcon      = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const AuditIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const PhaseIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const PendingIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtDateTime(d) { if (!d) return '—'; const dt = new Date(d); return `${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`; }

const ACTION_COLORS = {
  TEAM_REGISTERED: 'text-sky-700 bg-sky-50',
  TEAM_MENTOR_APPROVED: 'text-emerald-700 bg-emerald-50',
  TEAM_MENTOR_REJECTED: 'text-red-700 bg-red-50',
  TEAM_COORDINATOR_ACTIVATED: 'text-indigo-700 bg-indigo-50',
  TEAM_COORDINATOR_REJECTED: 'text-red-700 bg-red-50',
  MENTOR_ASSIGNED: 'text-purple-700 bg-purple-50',
  MENTOR_FORCE_REASSIGNED: 'text-orange-700 bg-orange-50',
  MILESTONE_CREATED: 'text-teal-700 bg-teal-50',
  MILESTONE_DELETED: 'text-red-700 bg-red-50',
  DEADLINE_EXTENDED: 'text-amber-700 bg-amber-50',
  SUBMISSION_UPLOADED: 'text-cyan-700 bg-cyan-50',
  FEEDBACK_POSTED: 'text-violet-700 bg-violet-50',
  ANNOUNCEMENT_CREATED: 'text-pink-700 bg-pink-50',
  PHASE_CHANGED: 'text-yellow-700 bg-yellow-50',
  TEAM_STATUS_REVOKED: 'text-orange-700 bg-orange-50',
  default: 'text-slate-600 bg-slate-50',
};

export default function CoordinatorDashboard() {
  const api = useApi();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get('/coordinator/pending-teams').then(t => setPendingCount(t.length)).catch(() => {});
  }, []); // eslint-disable-line

  const navItems = [
    { to: '/coordinator', end: true, label: 'Cockpit', icon: <HomeIcon /> },
    { to: '/coordinator/pending', label: 'Activate Teams', icon: <PendingIcon />, badge: pendingCount },
    { to: '/coordinator/teams', label: 'All Teams', icon: <TeamsIcon /> },
    { to: '/coordinator/mentors', label: 'Mentors', icon: <MentorIcon /> },
    { to: '/coordinator/milestones', label: 'Milestones', icon: <MilestoneIcon /> },
    { to: '/coordinator/announcements', label: 'Announcements', icon: <AnnIcon /> },
    { to: '/coordinator/phase', label: 'Phase Control', icon: <PhaseIcon /> },
    { to: '/coordinator/audit', label: 'Audit Log', icon: <AuditIcon /> },
  ];

  return (
    <Layout navItems={navItems} title="Coordinator Cockpit"
      quickActions={[
        { label: 'Activate Teams', icon: <PendingIcon />, onClick: () => window.location.href = '/coordinator/pending' },
        { label: 'Phase Control', icon: <PhaseIcon />, onClick: () => window.location.href = '/coordinator/phase' },
        { label: 'New Announcement', icon: <AnnIcon />, onClick: () => window.location.href = '/coordinator/announcements' },
      ]}>
      <Routes>
        <Route index element={<CoordHome pendingCount={pendingCount} />} />
        <Route path="pending" element={<CoordPendingTeams onCountChange={setPendingCount} />} />
        <Route path="teams" element={<CoordTeams />} />
        <Route path="mentors" element={<CoordMentors />} />
        <Route path="milestones" element={<CoordMilestones />} />
        <Route path="announcements" element={<CoordAnnouncements />} />
        <Route path="phase" element={<CoordPhaseControl />} />
        <Route path="audit" element={<CoordAuditLog />} />
      </Routes>
    </Layout>
  );
}

// ─── Cockpit Overview ─────────────────────────────────────────────────────────
function CoordHome({ pendingCount }) {
  const api = useApi();
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [phase, setPhase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/coordinator/overview').catch(() => null),
      api.get('/coordinator/phase').catch(() => null),
    ]).then(([s, p]) => { setStats(s); setPhase(p); }).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const currentPhase = phase?.phases?.find(p => p.number === phase?.currentPhase);

  const teamChartData = stats ? [
    { name: 'Active', value: stats.activeTeams || 0, fill: '#10b981' },
    { name: 'Pending Activation', value: stats.pendingTeams || 0, fill: '#6366f1' },
    { name: 'Registering', value: Math.max(0, (stats.totalTeams || 0) - (stats.activeTeams || 0) - (stats.pendingTeams || 0)), fill: '#94a3b8' },
  ].filter(d => d.value > 0) : [];

  const msChartData = stats ? [
    { name: 'Approved', value: stats.approvedMilestones || 0, fill: '#10b981' },
    { name: 'Pending', value: Math.max(0, (stats.totalMilestones || 0) - (stats.approvedMilestones || 0)), fill: '#e2e8f0' },
  ] : [];

  const insights = stats ? [
    stats.pendingTeams > 0 && { type: 'warning', msg: `${stats.pendingTeams} team${stats.pendingTeams > 1 ? 's' : ''} mentor-approved, awaiting your activation` },
    stats.pendingReviews > 0 && { type: 'info', msg: `${stats.pendingReviews} submission${stats.pendingReviews > 1 ? 's' : ''} waiting for mentor review` },
    stats.totalTeams > 0 && (stats.totalTeams - stats.activeTeams - stats.pendingTeams) > 2 && { type: 'info', msg: `${stats.totalTeams - stats.activeTeams - stats.pendingTeams} teams still in registration — consider reviewing` },
    stats.totalMilestones > 0 && stats.approvedMilestones / stats.totalMilestones < 0.3 && { type: 'warning', msg: `Milestone approval rate is ${Math.round((stats.approvedMilestones / stats.totalMilestones) * 100)}% — low completion rate` },
  ].filter(Boolean) : [];

  const downloadExcel = async () => {
    try {
      const resp = await fetch(`${API_BASE}/reports/excel`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `captrack_report.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <p className="text-sm text-indigo-700 font-medium">{pendingCount} team{pendingCount !== 1 ? 's' : ''} awaiting coordinator activation</p>
          <a href="/coordinator/pending" className="ml-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Activate →</a>
        </div>
      )}

      {phase && (
        <div className="p-5 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', border: '1px solid #c7d2fe' }}>
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 80% 50%, #c7d2fe, transparent)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Active Phase</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800">{currentPhase?.name || `Phase ${phase.currentPhase}`}</h3>
            <p className="text-sm text-slate-500 mt-1">{currentPhase?.description}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Coordinator Cockpit</h2>
          <p className="text-slate-500 text-sm mt-1">System-wide control panel</p>
        </div>
        <button onClick={downloadExcel} className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export Report
        </button>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Teams', value: stats?.totalTeams, color: '#6366f1', icon: '👥' },
          { label: 'Active Teams', value: stats?.activeTeams, color: '#10b981', icon: '✅' },
          { label: 'Pending Activation', value: stats?.pendingTeams, color: '#f59e0b', icon: '⏳' },
          { label: 'Pending Reviews', value: stats?.pendingReviews, color: '#ef4444', icon: '🔔' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <span className="text-lg">{s.icon}</span>
            </div>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value ?? '—'}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      {!loading && stats && (
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 card p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Teams by Status</h3>
            <p className="text-xs text-slate-400 mb-4">{stats.totalTeams} teams registered</p>
            {teamChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={teamChartData} layout="vertical" margin={{ left: 4, right: 32, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [v, 'Teams']} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
                    {teamChartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-slate-400 py-10 text-center">No team data yet</p>}
          </div>

          <div className="md:col-span-2 card p-5 flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Milestones</h3>
            <p className="text-xs text-slate-400 mb-2">{stats.totalMilestones} total · {stats.approvedMilestones} approved</p>
            <div className="flex-1 flex items-center justify-center">
              {stats.totalMilestones > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={msChartData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
                      {msChartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-slate-400 py-10 text-center">No milestones yet</p>}
            </div>
            <div className="flex justify-center gap-5 mt-1">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#10b981' }} /><span className="text-xs text-slate-600">Approved</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#e2e8f0' }} /><span className="text-xs text-slate-600">Pending</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            System Insights
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: ins.type === 'warning' ? '#fffbeb' : '#eef2ff', border: `1px solid ${ins.type === 'warning' ? '#fde68a' : '#c7d2fe'}` }}>
                <span className="text-base flex-shrink-0 mt-0.5">{ins.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <p className="text-sm text-slate-700">{ins.msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Mentors', value: stats?.totalMentors, color: '#8b5cf6' },
          { label: 'Milestones Set', value: stats?.totalMilestones, color: '#06b6d4' },
          { label: 'Milestones Approved', value: stats?.approvedMilestones, color: '#10b981' },
          { label: 'Current Phase', value: phase ? `Phase ${phase.currentPhase}` : '—', color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{s.label}</p>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value ?? '—'}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activate Pending Teams ───────────────────────────────────────────────────
function CoordPendingTeams({ onCountChange }) {
  const api = useApi();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try { const t = await api.get('/coordinator/pending-teams'); setTeams(t); onCountChange(t.length); }
    catch { setTeams([]); } finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const activate = async (id) => {
    setActing(id);
    try { await api.post(`/coordinator/teams/${id}/activate`, {}); toast('Team activated successfully', 'success'); load(); }
    catch (err) { toast(err.message, 'error'); } finally { setActing(null); }
  };

  const reject = async () => {
    setActing(rejectModal);
    try { await api.post(`/coordinator/teams/${rejectModal}/reject`, { reason }); toast('Team rejected', 'info'); setRejectModal(null); setReason(''); load(); }
    catch (err) { toast(err.message, 'error'); } finally { setActing(null); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Activate Teams</h2>
        <span className="badge badge-pending">{teams.length} awaiting activation</span>
      </div>

      {loading ? <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
        : teams.length === 0 ? (
          <div className="card p-16 text-center">
            <svg className="w-12 h-12 text-emerald-700/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-slate-500">No teams pending activation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map(t => (
              <div key={t.id} className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-indigo-600 font-bold">{t.teamCode}</span>
                  <span className={`badge ${t.type === 'External' ? 'badge-external' : 'badge-internal'}`}>{t.type || 'Internal'}</span>
                  <span className="badge badge-approved ml-1">Mentor Approved</span>
                  <span className="text-xs text-slate-600 ml-auto">{fmtDate(t.mentorApprovedAt)}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="text-xs text-slate-500 mb-1">Leader</p>
                    <p className="text-sm font-bold text-slate-800">{t.leader.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.leader.department} · Div {t.leader.division} · CGPI {t.leader.cgpi}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="text-xs text-slate-500 mb-1">Approved by Mentor</p>
                    <p className="text-sm font-bold text-slate-800">{t.mentor?.name || '—'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.mentor?.email}</p>
                  </div>
                </div>
                {t.members?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.members.map((m, i) => <span key={i} className="text-xs px-2 py-1 rounded-lg text-slate-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{m.name}</span>)}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => activate(t.id)} disabled={acting === t.id} className="btn-success text-sm">{acting === t.id ? 'Activating…' : '⚡ Activate Team'}</button>
                  <button onClick={() => { setRejectModal(t.id); setReason(''); }} disabled={acting === t.id} className="btn-danger text-sm">✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-modal p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Reject Team</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} className="input resize-none mb-4" rows={3} placeholder="Reason for rejection…" />
            <div className="flex gap-3">
              <button onClick={reject} disabled={acting === rejectModal} className="btn-danger flex-1">Confirm Reject</button>
              <button onClick={() => { setRejectModal(null); setReason(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── All Teams ────────────────────────────────────────────────────────────────
function CoordTeams() {
  const api = useApi();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [revokeModal, setRevokeModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [acting, setActing] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/coordinator/teams'), api.get('/coordinator/mentors')])
      .then(([t, m]) => { setTeams(t); setMentors(m); }).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const load = async () => {
    try { const t = await api.get('/coordinator/teams'); setTeams(t); } catch {}
  };

  const forceAssign = async () => {
    if (!assignModal) return;
    setActing(assignModal);
    try {
      await api.post(`/coordinator/teams/${assignModal}/force-assign`, { mentorId: selectedMentor || null });
      toast('Mentor reassigned', 'success');
      setAssignModal(null); setSelectedMentor('');
      load();
    } catch (err) { toast(err.message, 'error'); } finally { setActing(null); }
  };

  const revoke = async (reason) => {
    if (!revokeModal) return;
    setActing(revokeModal);
    try {
      await api.post(`/coordinator/teams/${revokeModal}/revoke`, { reason });
      toast('Team status revoked to Pending', 'info');
      setRevokeModal(null); load();
    } catch (err) { toast(err.message, 'error'); } finally { setActing(null); }
  };

  const exportXLSX = () => {
    const rows = teams.map(t => ({
      'Team ID': t.teamCode, 'Leader': t.leaderName, 'Type': t.type, 'Status': t.status,
      'Project': t.projectTitle || '', 'Mentor': t.mentor?.name || '', 'Milestones': t.milestones?.length || 0,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Teams');
    XLSX.writeFile(wb, 'teams.xlsx');
  };

  const filtered = teams.filter(t =>
    !search || t.teamCode?.toLowerCase().includes(search.toLowerCase()) ||
    t.leaderName?.toLowerCase().includes(search.toLowerCase()) ||
    t.projectTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_ORDER = { ACTIVE: 0, MENTOR_APPROVED: 1, PENDING: 2, REJECTED: 3 };
  filtered.sort((a, b) => (STATUS_ORDER[a.status] || 9) - (STATUS_ORDER[b.status] || 9));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h2 className="text-xl font-bold text-slate-800">All Teams</h2>
        <span className="badge badge-active">{teams.filter(t => t.status === 'ACTIVE').length} active</span>
        <div className="ml-auto flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} className="input text-sm max-w-48" placeholder="Search teams…" />
          <button onClick={exportXLSX} className="btn-secondary text-sm">↓ Export</button>
        </div>
      </div>

      {loading ? <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div> : (
        <div className="card overflow-hidden">
          <table className="w-full table-dark">
            <thead>
              <tr>
                {['Team ID', 'Leader', 'Type', 'Status', 'Project', 'Mentor', 'Milestones', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td className="px-4"><span className="font-mono text-indigo-600 font-bold">{t.teamCode}</span></td>
                  <td className="px-4 text-slate-800 font-medium">{t.leaderName}</td>
                  <td className="px-4"><span className={`badge ${t.type === 'External' ? 'badge-external' : 'badge-internal'}`}>{t.type || 'Internal'}</span></td>
                  <td className="px-4">
                    <span className={`badge ${t.status === 'ACTIVE' ? 'badge-active' : t.status === 'MENTOR_APPROVED' ? 'badge-approved' : t.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                      {t.status === 'MENTOR_APPROVED' ? 'Mentor ✓' : t.status}
                    </span>
                  </td>
                  <td className="px-4 max-w-32 truncate text-slate-400 text-xs">{t.projectTitle || '—'}</td>
                  <td className="px-4 text-sm text-slate-700">{t.mentor?.name || <span className="text-slate-600">Unassigned</span>}</td>
                  <td className="px-4 text-center">{t.milestones?.length || 0}</td>
                  <td className="px-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => { setAssignModal(t.id); setSelectedMentor(t.mentorId || ''); }}
                        className="text-xs px-2.5 py-1 rounded-lg text-indigo-600 font-medium transition-colors hover:text-indigo-300"
                        style={{ background: '#eef2ff' }}>Reassign</button>
                      {t.status === 'ACTIVE' && (
                        <button onClick={() => setRevokeModal(t.id)}
                          className="text-xs px-2.5 py-1 rounded-lg text-amber-600 font-medium transition-colors hover:text-amber-300"
                          style={{ background: '#fffbeb' }}>Revoke</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-16 text-center"><p className="text-slate-500">No teams found</p></div>}
        </div>
      )}

      {/* Force assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-modal p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Force Reassign Mentor</h3>
            <select value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)} className="input mb-4" style={{ background: 'white' }}>
              <option value="">— Remove mentor —</option>
              {mentors.map(m => <option key={m.id} value={m.id} style={{ background: 'white' }}>{m.name} ({m._count?.assignedTeams || 0} teams)</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={forceAssign} disabled={acting === assignModal} className="btn-primary flex-1">{acting === assignModal ? 'Assigning…' : 'Confirm'}</button>
              <button onClick={() => setAssignModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke modal */}
      {revokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-modal p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Revoke Team Status</h3>
            <p className="text-sm text-slate-400 mb-4">This will send the team back to PENDING status.</p>
            <div className="flex gap-3">
              <button onClick={() => revoke('Revoked by coordinator')} disabled={acting === revokeModal} className="btn-danger flex-1">Confirm Revoke</button>
              <button onClick={() => setRevokeModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mentors ──────────────────────────────────────────────────────────────────
function CoordMentors() {
  const api = useApi();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coordinator/mentors').then(setMentors).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Mentors</h2>
      {loading ? <div className="grid md:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
        : (
          <div className="grid md:grid-cols-3 gap-4">
            {mentors.map(m => (
              <div key={m.id} className="card-hover p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-slate-800 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{m.name}</p>
                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {m.department && <p className="text-xs text-slate-500">{m.department}</p>}
                    {m.expertise && <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{m.expertise}</p>}
                  </div>
                  <span className="text-2xl font-bold text-indigo-600 flex-shrink-0">{m._count?.assignedTeams || 0}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{m._count?.assignedTeams || 0} teams assigned</p>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Milestones ───────────────────────────────────────────────────────────────
function CoordMilestones() {
  const api = useApi();
  const toast = useToast();
  const [milestones, setMilestones] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', deadline: '', teamId: '', allTeams: false });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, t] = await Promise.all([api.get('/coordinator/milestones'), api.get('/coordinator/teams')]);
      setMilestones(m); setTeams(t.filter(t => t.status === 'ACTIVE'));
    } catch {} finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.deadline) { toast('Title and deadline required', 'warning'); return; }
    if (!form.allTeams && !form.teamId) { toast('Select a team or choose all teams', 'warning'); return; }
    setCreating(true);
    try {
      const body = { title: form.title.trim(), deadline: form.deadline };
      if (form.allTeams) body.teamIds = teams.map(t => t.id);
      else body.teamId = form.teamId;
      await api.post('/coordinator/milestones', body);
      toast('Milestone(s) created', 'success');
      setForm({ title: '', deadline: '', teamId: '', allTeams: false });
      load();
    } catch (err) { toast(err.message, 'error'); } finally { setCreating(false); }
  };

  const deleteMilestone = async (id) => {
    try { await api.delete(`/coordinator/milestones/${id}`); toast('Milestone deleted', 'info'); load(); }
    catch (err) { toast(err.message, 'error'); }
  };

  const exportXLSX = () => {
    const rows = milestones.map(m => ({
      Title: m.title, Deadline: fmtDate(m.deadline), Status: m.status,
      Team: m.team?.teamCode || '', Leader: m.team?.leaderName || '', Mentor: m.team?.mentorName || '',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Milestones');
    XLSX.writeFile(wb, 'milestones.xlsx');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800">Milestones</h2>
        <button onClick={exportXLSX} className="btn-secondary text-sm ml-auto">↓ Export</button>
      </div>

      <form onSubmit={create} className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Create Milestone</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Title *</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Synopsis Submission" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Deadline *</label>
            <input type="date" required value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="input" style={{ colorScheme: 'light' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Target</label>
            <select value={form.allTeams ? '__all__' : form.teamId}
              onChange={e => { const v = e.target.value; if (v === '__all__') { setForm(p => ({ ...p, allTeams: true, teamId: '' })); } else { setForm(p => ({ ...p, allTeams: false, teamId: v })); } }}
              className="input" style={{ background: 'white' }}>
              <option value="">— Select team —</option>
              <option value="__all__" style={{ background: 'white' }}>ALL Active Teams</option>
              {teams.map(t => <option key={t.id} value={t.id} style={{ background: 'white' }}>{t.teamCode} · {t.leaderName}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={creating} className="btn-primary text-sm">{creating ? 'Creating…' : '+ Create Milestone'}</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full table-dark">
          <thead>
            <tr>{['Title', 'Deadline', 'Status', 'Team', 'Mentor', ''].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? [1,2,3].map(i => <tr key={i}><td colSpan={6} className="px-4 py-2"><Skeleton className="h-4 w-full" /></td></tr>)
              : milestones.map(m => (
                <tr key={m.id}>
                  <td className="px-4 font-semibold text-slate-800">{m.title}</td>
                  <td className="px-4 text-slate-400">{fmtDate(m.deadline)}</td>
                  <td className="px-4">
                    <span className={`badge ${m.status === 'APPROVED' ? 'badge-approved' : m.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>{m.status}</span>
                  </td>
                  <td className="px-4 font-mono text-indigo-600 text-xs">{m.team?.teamCode}</td>
                  <td className="px-4 text-slate-400 text-xs">{m.team?.mentorName || '—'}</td>
                  <td className="px-4">
                    <button onClick={() => deleteMilestone(m.id)} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && milestones.length === 0 && <div className="p-16 text-center"><p className="text-slate-500">No milestones yet</p></div>}
      </div>
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
function CoordAnnouncements() {
  const api = useApi();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '', priority: 'NORMAL' });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try { setAnnouncements(await api.get('/coordinator/announcements')); } catch {} finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast('Title and content required', 'warning'); return; }
    setCreating(true);
    try {
      await api.post('/coordinator/announcements', form);
      toast(`${form.priority === 'BROADCAST' ? '📢 Broadcast' : 'Announcement'} posted`, 'success');
      setForm({ title: '', content: '', priority: 'NORMAL' });
      load();
    } catch (err) { toast(err.message, 'error'); } finally { setCreating(false); }
  };

  const del = async (id) => {
    try { await api.delete(`/coordinator/announcements/${id}`); toast('Deleted', 'info'); load(); }
    catch (err) { toast(err.message, 'error'); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Announcements</h2>

      <form onSubmit={create} className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">New Announcement</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Title *</label>
          <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="Announcement title" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Content *</label>
          <textarea required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className="input resize-none" rows={4} placeholder="Announcement body…" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Priority / Type</label>
          <div className="flex gap-3">
            {[
              { key: 'NORMAL', label: 'Normal', color: '#f1f5f9', border: '#e2e8f0' },
              { key: 'HIGH', label: '🔔 High Priority', color: '#fff7ed', border: '#fed7aa' },
              { key: 'BROADCAST', label: '📢 Broadcast', color: '#fef2f2', border: '#fecaca' },
            ].map(p => (
              <button key={p.key} type="button" onClick={() => setForm(f => ({ ...f, priority: p.key }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${form.priority === p.key ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                style={{ background: form.priority === p.key ? p.color : '#f8fafc', borderColor: form.priority === p.key ? p.border : '#e2e8f0' }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={creating} className="btn-primary text-sm">{creating ? 'Posting…' : form.priority === 'BROADCAST' ? '📢 Broadcast Now' : 'Post Announcement'}</button>
      </form>

      {loading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        : announcements.map(a => (
          <div key={a.id} className="card-hover p-5">
            <div className="flex items-start gap-3 mb-2">
              {a.priority === 'BROADCAST' && <span className="badge badge-broadcast flex-shrink-0">Broadcast</span>}
              {a.priority === 'HIGH' && <span className="badge badge-high flex-shrink-0">High</span>}
              <h3 className="font-semibold text-slate-800 flex-1">{a.title}</h3>
              <span className="text-xs text-slate-600 flex-shrink-0">{fmtDate(a.createdAt)}</span>
              <button onClick={() => del(a.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{a.content}</p>
          </div>
        ))}
    </div>
  );
}

// ─── Phase Control ────────────────────────────────────────────────────────────
function CoordPhaseControl() {
  const api = useApi();
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editPhases, setEditPhases] = useState(null);

  useEffect(() => {
    api.get('/coordinator/phase').then(c => { setConfig(c); setEditPhases(c.phases); }).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const setPhase = async (n) => {
    setSaving(true);
    try {
      const updated = await api.put('/coordinator/phase', { currentPhase: n, phases: editPhases });
      setConfig(updated); setEditPhases(updated.phases);
      toast(`Switched to ${updated.phases?.find(p => p.number === n)?.name || `Phase ${n}`}`, 'success');
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };

  const PHASE_META = [
    { n: 0, icon: '🔧', color: '#64748b' },
    { n: 1, icon: '📋', color: '#6366f1' },
    { n: 2, icon: '📊', color: '#f59e0b' },
    { n: 3, icon: '🏁', color: '#10b981' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Phase Control</h2>
      <p className="text-sm text-slate-400">Control the global capstone phase. Each phase communicates the current stage to all teams and mentors.</p>

      {loading ? <Skeleton className="h-64 w-full" /> : config && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {PHASE_META.map(({ n, icon, color }) => {
              const phaseData = editPhases?.find(p => p.number === n) || config.phases?.find(p => p.number === n) || { name: `Phase ${n}`, description: '' };
              const isActive = config.currentPhase === n;
              return (
                <div key={n} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${isActive ? 'border-opacity-60' : 'border-opacity-0'}`}
                  onClick={() => !saving && setPhase(n)}
                  style={{
                    background: isActive ? `rgba(${color.replace('#','').match(/../g).map(c=>parseInt(c,16)).join(',')},0.08)` : '#f8fafc',
                    borderColor: isActive ? color : '#e2e8f0',
                    borderWidth: '2px',
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{icon}</span>
                    {isActive && <span className="text-xs font-bold text-emerald-400 ml-auto">● ACTIVE</span>}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{phaseData.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{phaseData.description}</p>
                </div>
              );
            })}
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Phase</p>
            <div className="flex items-center gap-3">
              <div className="text-4xl">{PHASE_META[config.currentPhase]?.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{config.phases?.find(p => p.number === config.currentPhase)?.name || `Phase ${config.currentPhase}`}</h3>
                <p className="text-sm text-slate-400">{config.phases?.find(p => p.number === config.currentPhase)?.description}</p>
                <p className="text-xs text-slate-600 mt-1">Last updated {fmtDateTime(config.updatedAt)}</p>
              </div>
            </div>
          </div>

          {saving && <p className="text-xs text-indigo-600 text-center animate-pulse">Updating phase…</p>}
        </>
      )}
    </div>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
function CoordAuditLog() {
  const api = useApi();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const result = await api.get(`/coordinator/audit-log?page=${p}&limit=50`);
      setLogs(result.data || []);
      setTotal(result.total || 0);
      setPage(result.page || 1);
      setTotalPages(result.totalPages || 1);
    } catch {} finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { load(1); }, [load]);

  const filtered = filter
    ? logs.filter(l => l.action.toLowerCase().includes(filter.toLowerCase()) ||
        l.performedByName?.toLowerCase().includes(filter.toLowerCase()) ||
        l.targetName?.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h2 className="text-xl font-bold text-slate-800">Audit Log</h2>
        <span className="badge badge-active">{total} total entries</span>
        <input value={filter} onChange={e => setFilter(e.target.value)} className="input text-sm max-w-48 ml-auto" placeholder="Filter this page…" />
      </div>

      {loading ? <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        : filtered.length === 0 ? <div className="card p-16 text-center"><p className="text-slate-500">No log entries yet</p></div>
        : (
          <>
            <div className="card overflow-hidden mb-4">
              <table className="w-full table-dark">
                <thead>
                  <tr>{['Action', 'Performed By', 'Target', 'Details', 'Time'].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id}>
                      <td className="px-4">
                        <span className={`audit-chip ${ACTION_COLORS[l.action] || ACTION_COLORS.default}`}>{l.action}</span>
                      </td>
                      <td className="px-4 text-slate-700 text-xs font-medium">{l.performedByName}</td>
                      <td className="px-4 text-slate-400 text-xs">{l.targetName || '—'}</td>
                      <td className="px-4 text-slate-500 text-xs max-w-48 truncate" title={l.details}>{l.details || '—'}</td>
                      <td className="px-4 text-slate-600 text-xs whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => load(page - 1)} disabled={page <= 1}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={p} onClick={() => load(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${p === page ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => load(page + 1)} disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}
