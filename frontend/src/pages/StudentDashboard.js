import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ProjectIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CalendarIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SubmitIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const FeedbackIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const AnnouncementIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const KanbanIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

// ─── Pending Gateway ──────────────────────────────────────────────────────────
function PendingGateway({ status, rejectionReason, requestedMentor }) {
  const configs = {
    PENDING: {
      icon: '⏳',
      color: 'amber',
      title: 'Awaiting Mentor Approval',
      description: requestedMentor
        ? `Your registration is in ${requestedMentor.name}'s approval queue. Once they approve, a coordinator will activate your account.`
        : 'Your registration is pending. Please wait for a mentor to be assigned and approve your team.',
      step: 1,
    },
    MENTOR_APPROVED: {
      icon: '✅',
      color: 'indigo',
      title: 'Mentor Approved — Awaiting Coordinator',
      description: 'Your mentor has approved your team. The coordinator will review and activate your account shortly.',
      step: 2,
    },
    REJECTED: {
      icon: '❌',
      color: 'red',
      title: 'Registration Rejected',
      description: rejectionReason || 'Your team registration was rejected. Please contact your department coordinator.',
      step: 0,
    },
  };

  const cfg = configs[status] || configs.PENDING;
  const borderColor = cfg.color === 'amber' ? '#fde68a' : cfg.color === 'indigo' ? '#c7d2fe' : '#fecaca';
  const bgColor = cfg.color === 'amber' ? '#fffbeb' : cfg.color === 'indigo' ? '#eef2ff' : '#fef2f2';

  const steps = [
    { label: 'Registered', done: true },
    { label: 'Mentor Approval', done: status === 'MENTOR_APPROVED' || status === 'ACTIVE' },
    { label: 'Coordinator Activation', done: status === 'ACTIVE' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="max-w-md w-full">
        <div className="p-8 rounded-2xl text-center mb-6" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
          <div className="text-5xl mb-4">{cfg.icon}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{cfg.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{cfg.description}</p>
        </div>

        {status !== 'REJECTED' && (
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Approval Progress</p>
            <div className="flex items-center gap-0">
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step.done ? 'border-emerald-500 text-emerald-600' : i === cfg.step ? 'border-indigo-500 text-indigo-600' : 'border-slate-200 text-slate-400'}`}
                      style={step.done ? { background: '#ecfdf5' } : i === cfg.step ? { background: '#eef2ff' } : { background: '#f8fafc' }}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs mt-1.5 font-medium text-center max-w-16 leading-tight ${step.done ? 'text-emerald-600' : i === cfg.step ? 'text-indigo-600' : 'text-slate-600'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px mx-2 mb-5" style={{ background: step.done ? '#6ee7b7' : '#e2e8f0' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-4">
          You are logged in as <span className="text-slate-400 font-mono">{requestedMentor ? 'team member' : 'student'}</span> — this page will update once your team is activated.
        </p>
      </div>
    </div>
  );
}

const navItems = [
  { to: '/student', end: true, label: 'Overview', icon: <HomeIcon /> },
  { to: '/student/project', label: 'Project', icon: <ProjectIcon /> },
  { to: '/student/calendar', label: 'Milestones', icon: <CalendarIcon /> },
  { to: '/student/kanban', label: 'Task Board', icon: <KanbanIcon /> },
  { to: '/student/submissions', label: 'Submissions', icon: <SubmitIcon /> },
  { to: '/student/feedback', label: 'Feedback', icon: <FeedbackIcon /> },
  { to: '/student/announcements', label: 'Announcements', icon: <AnnouncementIcon /> },
];

export default function StudentDashboard() {
  const { user } = useAuth();

  if (user?.status && user.status !== 'ACTIVE') {
    return (
      <Layout navItems={navItems} title="Student Portal">
        <PendingGateway
          status={user.status}
          rejectionReason={user.rejectionReason}
          requestedMentor={user.requestedMentor}
        />
      </Layout>
    );
  }

  return (
    <Layout navItems={navItems} title="Student Portal"
      quickActions={[
        { label: 'Upload Submission', icon: <SubmitIcon />, onClick: () => window.location.href = '/student/submissions' },
        { label: 'View Feedback', icon: <FeedbackIcon />, onClick: () => window.location.href = '/student/feedback' },
        { label: 'Task Board', icon: <KanbanIcon />, onClick: () => window.location.href = '/student/kanban' },
      ]}>
      <Routes>
        <Route index element={<StudentHome />} />
        <Route path="project" element={<StudentProject />} />
        <Route path="calendar" element={<StudentCalendar />} />
        <Route path="kanban" element={<StudentKanban />} />
        <Route path="submissions" element={<StudentSubmissions />} />
        <Route path="feedback" element={<StudentFeedback />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
      </Routes>
    </Layout>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useMilestones() {
  const api = useApi();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { setMilestones(await api.get('/student/milestones')); }
    catch { setMilestones([]); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  return { milestones, loading, refetch: load };
}

function useSubmissions() {
  const api = useApi();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { setSubmissions(await api.get('/student/submissions')); }
    catch { setSubmissions([]); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  return { submissions, loading, refetch: load };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function statusBadge(s) {
  const m = { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' };
  return <span className={`badge ${m[s] || 'badge-pending'}`}>{s}</span>;
}
function priorityBadge(p) {
  const m = { LOW: 'text-slate-500', MEDIUM: 'text-amber-600', HIGH: 'text-red-600' };
  return <span className={`text-xs font-semibold ${m[p] || ''}`}>{p}</span>;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, loading }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      {loading ? <Skeleton className="h-8 w-16" /> : (
        <div className="text-3xl font-bold text-slate-800">{value}</div>
      )}
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function StudentHome() {
  const { user } = useAuth();
  const api = useApi();
  const [teamInfo, setTeamInfo] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/me').catch(() => null),
      api.get('/student/milestones').catch(() => []),
      api.get('/student/announcements').catch(() => []),
    ]).then(([t, m, a]) => {
      setTeamInfo(t);
      setMilestones(m);
      setAnnouncements(a);
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const approved = milestones.filter(m => m.status === 'APPROVED').length;
  const pending  = milestones.filter(m => m.status === 'PENDING').length;
  const progress = milestones.length ? Math.round((approved / milestones.length) * 100) : 0;

  const upcoming = milestones
    .filter(m => m.status === 'PENDING' && new Date(m.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const broadcast = announcements.filter(a => a.priority === 'BROADCAST' || a.priority === 'HIGH');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Broadcast banner */}
      {broadcast.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
          <div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Broadcast — {broadcast[0].title}</span>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{broadcast[0].content}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, {user?.leaderName?.split(' ')[0] || 'Team'} 👋</h2>
        <p className="text-slate-500 text-sm mt-1">Team {user?.teamCode} · {user?.leader?.department || 'Department'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Milestones" value={loading ? '—' : milestones.length} icon={<CalendarIcon />} accent="#6366f1" loading={loading} />
        <StatCard label="Approved"   value={loading ? '—' : approved}           icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} accent="#10b981" loading={loading} />
        <StatCard label="Pending"    value={loading ? '—' : pending}            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} accent="#f59e0b" loading={loading} />
        <StatCard label="Progress"   value={loading ? '—' : `${progress}%`}    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} accent="#8b5cf6" loading={loading} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Team info */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Team Details</h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}</div>
          ) : teamInfo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Team ID</span>
                <span className="font-mono font-bold text-indigo-600">{teamInfo.teamCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Type</span>
                <span className={`badge ${teamInfo.type === 'External' ? 'badge-external' : 'badge-internal'}`}>{teamInfo.type || 'Internal'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Mentor</span>
                <span className="text-sm text-slate-800">{teamInfo.mentor?.name || <span className="text-slate-500">Not assigned</span>}</span>
              </div>
              {teamInfo.projectTitle && (
                <div>
                  <span className="text-xs text-slate-500">Project</span>
                  <p className="text-sm text-slate-800 mt-1 leading-relaxed">{teamInfo.projectTitle}</p>
                </div>
              )}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Overall Progress</span>
                  <span className="text-xs font-bold text-indigo-600">{progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No team data available.</p>
          )}
        </div>

        {/* Upcoming milestones */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Upcoming Deadlines</h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(m => {
                const days = Math.ceil((new Date(m.deadline) - new Date()) / 86400000);
                const urgent = days <= 3;
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgent ? 'bg-red-400' : 'bg-indigo-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">{m.title}</p>
                      <p className="text-xs text-slate-500">{fmtDate(m.deadline)}</p>
                    </div>
                    <span className={`text-xs font-bold ${urgent ? 'text-red-600' : 'text-slate-400'}`}>
                      {days === 0 ? 'Today!' : days === 1 ? '1 day' : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent announcements */}
      {announcements.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Announcements</h3>
          <div className="space-y-3">
            {announcements.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                {a.priority === 'BROADCAST' && <span className="badge badge-broadcast mt-0.5 flex-shrink-0">Broadcast</span>}
                {a.priority === 'HIGH' && <span className="badge badge-high mt-0.5 flex-shrink-0">High</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{a.content}</p>
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0">{fmtDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Project ──────────────────────────────────────────────────────────────────
function StudentProject() {
  const api = useApi();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { const p = await api.get('/student/project'); setProject(p); if (p) setForm({ title: p.title, description: p.description || '' }); }
    catch {}
    finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const method = project ? 'put' : 'post';
      const res = await api[method]('/student/project', { title: form.title.trim(), description: form.description.trim() });
      setProject(res);
      setEditing(false);
      toast('Project saved successfully', 'success');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Project Details</h2>
        {project && !editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm">Edit</button>
        )}
      </div>

      {!project || editing ? (
        <form onSubmit={handleSave} className="card p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Project Title *</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="input" placeholder="e.g. Smart Attendance System using Face Recognition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input resize-none" rows={5} placeholder="Briefly describe your project's objectives and approach…" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}</button>
            {editing && <button type="button" onClick={() => { setEditing(false); setForm({ title: project.title, description: project.description || '' }); }} className="btn-secondary">Cancel</button>}
          </div>
        </form>
      ) : (
        <div className="card p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title</p>
            <h3 className="text-lg font-bold text-slate-800">{project.title}</h3>
          </div>
          {project.description && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
          <p className="text-xs text-slate-600">Last updated {fmtDate(project.updatedAt)}</p>
        </div>
      )}
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function StudentCalendar() {
  const { milestones, loading } = useMilestones();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const milestonesByDay = {};
  milestones.forEach(m => {
    const d = new Date(m.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const k = d.getDate();
      if (!milestonesByDay[k]) milestonesByDay[k] = [];
      milestonesByDay[k].push(m);
    }
  });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">{MONTH_NAMES[month]} {year}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="btn-icon"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={nextMonth} className="btn-icon"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-600 py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const msList = milestonesByDay[day] || [];
            return (
              <div key={day} className={`min-h-16 p-1.5 rounded-lg transition-colors ${isToday ? 'ring-1 ring-indigo-500' : ''}`}
                style={{ background: isToday ? '#eef2ff' : msList.length ? '#f8fafc' : 'transparent' }}>
                <span className={`text-xs font-semibold ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>{day}</span>
                {msList.map(m => (
                  <div key={m.id} className={`mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium truncate ${m.status === 'APPROVED' ? 'text-emerald-600' : m.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'}`}
                    style={{ background: m.status === 'APPROVED' ? '#ecfdf5' : m.status === 'REJECTED' ? '#fef2f2' : '#fffbeb' }}
                    title={m.title}>
                    {m.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone list */}
      <div className="mt-5 space-y-2">
        {loading ? [1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />) : milestones.map(m => (
          <div key={m.id} className="card-hover p-4 flex items-center gap-4">
            <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: m.status === 'APPROVED' ? '#059669' : m.status === 'REJECTED' ? '#dc2626' : '#4f46e5' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{m.title}</p>
              <p className="text-xs text-slate-500">{fmtDate(m.deadline)}</p>
            </div>
            {statusBadge(m.status)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kanban ───────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'TODO',        label: 'To Do',      color: '#6366f1' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b' },
  { key: 'REVIEW',      label: 'Review',      color: '#8b5cf6' },
  { key: 'DONE',        label: 'Done',        color: '#10b981' },
];

function StudentKanban() {
  const api = useApi();
  const toast = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assignedTo: '' });
  const [saving, setSaving] = useState(false);
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const [overCol, setOverCol] = useState(null);

  const load = useCallback(async () => {
    try { setTasks(await api.get('/student/kanban')); }
    catch { setTasks([]); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const task = await api.post('/student/kanban', form);
      setTasks(prev => [...prev, task]);
      setForm({ title: '', description: '', priority: 'MEDIUM', assignedTo: '' });
      setShowAdd(false);
      toast('Task created', 'success');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const moveTask = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try { await api.put(`/student/kanban/${taskId}`, { status: newStatus }); }
    catch { toast('Failed to update task', 'error'); load(); }
  };

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try { await api.delete(`/student/kanban/${taskId}`); toast('Task deleted', 'info'); }
    catch { toast('Failed to delete task', 'error'); load(); }
  };

  const onDragStart = (e, taskId) => {
    dragItem.current = taskId;
    e.currentTarget.classList.add('dragging');
  };
  const onDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    dragItem.current = null;
    setOverCol(null);
  };
  const onDragOver = (e, colKey) => {
    e.preventDefault();
    setOverCol(colKey);
  };
  const onDrop = (e, colKey) => {
    e.preventDefault();
    if (dragItem.current) moveTask(dragItem.current, colKey);
    setOverCol(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Task Board</h2>
          <p className="text-slate-500 text-sm mt-1">Drag cards between columns to update status</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="btn-primary text-sm">+ New Task</button>
      </div>

      {/* Add task form */}
      {showAdd && (
        <form onSubmit={handleCreate} className="card p-5 mb-6 space-y-4 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Task Title *</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Build login module" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Assign To</label>
              <input value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} className="input" placeholder="Team member name" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input resize-none" rows={2} placeholder="Optional details…" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Priority</label>
              <div className="flex gap-2">
                {['LOW','MEDIUM','HIGH'].map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.priority === p ? 'text-slate-800' : 'text-slate-500 border-slate-200'}`}
                    style={form.priority === p ? { background: p === 'HIGH' ? '#fef2f2' : p === 'MEDIUM' ? '#fffbeb' : '#f1f5f9', borderColor: p === 'HIGH' ? '#fca5a5' : p === 'MEDIUM' ? '#fde68a' : '#cbd5e1' } : {}}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 ml-auto">
              <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Adding…' : 'Add Task'}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {/* Kanban board */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map(c => <Skeleton key={c.key} className="h-64 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className={`kanban-col ${overCol === col.key ? 'drag-over' : ''} flex flex-col`}
                onDragOver={e => onDragOver(e, col.key)} onDrop={e => onDrop(e, col.key)}
                onDragLeave={() => setOverCol(null)}>
                {/* Column header */}
                <div className="flex items-center gap-2 p-4 pb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-bold text-slate-800">{col.label}</span>
                  <span className="ml-auto text-xs font-bold text-slate-500 px-2 py-0.5 rounded-full"
                    style={{ background: '#f1f5f9' }}>{colTasks.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 px-3 pb-3 space-y-2">
                  {colTasks.map(task => (
                    <div key={task.id} draggable onDragStart={e => onDragStart(e, task.id)} onDragEnd={onDragEnd}
                      className="kanban-card p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{task.title}</p>
                        <button onClick={() => deleteTask(task.id)} className="text-slate-600 hover:text-red-600 transition-colors flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      {task.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`priority-${task.priority}`} />
                        {priorityBadge(task.priority)}
                        {task.assignedTo && (
                          <span className="text-xs text-slate-600 truncate max-w-20">@{task.assignedTo}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-700">
                      <svg className="w-6 h-6 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      <p className="text-xs">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Comment Thread ───────────────────────────────────────────────────────────
function CommentThread({ submissionId, baseRoute }) {
  const api = useApi();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setComments(await api.get(`/${baseRoute}/submissions/${submissionId}/comments`)); }
    catch {} finally { setLoading(false); }
  };

  const toggle = () => { if (!open) load(); setOpen(o => !o); };

  const post = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      const c = await api.post(`/${baseRoute}/submissions/${submissionId}/comments`, { body: body.trim() });
      setComments(prev => [...prev, c]);
      setBody('');
    } catch {} finally { setPosting(false); }
  };

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const badge = (type) => {
    if (type === 'mentor') return { bg: '#ecfdf5', color: '#059669', label: 'Mentor' };
    if (type === 'coordinator') return { bg: '#eef2ff', color: '#4f46e5', label: 'Coord' };
    return { bg: '#f0f9ff', color: '#0284c7', label: 'Team' };
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
      <button onClick={toggle} className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {open ? 'Hide discussion' : 'Discussion'}
        {!open && comments.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-indigo-600 font-bold" style={{ background: '#eef2ff', fontSize: 10 }}>{comments.length}</span>}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="text-xs text-slate-400 py-2 text-center animate-pulse">Loading…</div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">No comments yet. Start the discussion!</div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {comments.map(c => {
                const b = badge(c.authorType);
                return (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: b.bg, color: b.color }}>
                      {c.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700">{c.authorName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: b.bg, color: b.color }}>{b.label}</span>
                        <span className="text-xs text-slate-400 ml-auto">{timeAgo(c.createdAt)}</span>
                      </div>
                      <div className="text-xs text-slate-600 rounded-xl px-3 py-2 leading-relaxed" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>{c.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <form onSubmit={post} className="flex gap-2">
            <input value={body} onChange={e => setBody(e.target.value)} placeholder="Write a comment…"
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all" />
            <button type="submit" disabled={posting || !body.trim()}
              className="text-xs px-3 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40"
              style={{ background: '#eef2ff', color: '#4f46e5' }}>
              {posting ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Submissions ──────────────────────────────────────────────────────────────
function StudentSubmissions() {
  const api = useApi();
  const toast = useToast();
  const { submissions, loading, refetch } = useSubmissions();
  const { milestones } = useMilestones();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', milestoneId: '' });
  const [files, setFiles] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.milestoneId) { toast('Title and milestone are required', 'warning'); return; }
    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('description', form.description.trim());
    fd.append('milestoneId', form.milestoneId);
    files.forEach(f => fd.append('files', f));
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/student/submissions`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      toast('Submission uploaded successfully', 'success');
      setForm({ title: '', description: '', milestoneId: '' });
      setFiles([]);
      refetch();
    } catch (err) { toast(err.message, 'error'); }
    finally { setUploading(false); }
  };

  const pendingMilestones = milestones.filter(m => m.status === 'PENDING');

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reports/pdf/me`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'interaction_sheet.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast('Could not download PDF', 'error'); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800">Submissions</h2>
        <button onClick={downloadPDF} className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Interaction Sheet PDF
        </button>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">New Submission</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Title *</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="Submission title" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Milestone *</label>
            <select required value={form.milestoneId} onChange={e => setForm(p => ({ ...p, milestoneId: e.target.value }))} className="input" style={{ background: '#f1f5f9' }}>
              <option value="">— Select milestone —</option>
              {pendingMilestones.map(m => <option key={m.id} value={m.id} style={{ background: 'white' }}>{m.title}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input resize-none" rows={2} placeholder="Brief description…" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">PDF Files (max 5, 10MB each)</label>
          <input type="file" accept=".pdf" multiple onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))}
            className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:text-indigo-600 file:cursor-pointer"
            style={{ '--file-bg': 'rgba(99,102,241,0.15)' }} />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /></svg>
                  {f.name} <span className="text-slate-600">({(f.size / 1024 / 1024).toFixed(1)}MB)</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" disabled={uploading} className="btn-primary">{uploading ? 'Uploading…' : 'Upload Submission'}</button>
      </form>

      {/* List */}
      <div className="space-y-3">
        {loading ? [1,2].map(i => <Skeleton key={i} className="h-24 w-full" />) : submissions.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500">No submissions yet</p>
          </div>
        ) : submissions.map(s => (
          <div key={s.id} className="card-hover p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-slate-800">{s.title}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold flex-shrink-0"
                    style={{ background: '#f1f5f9', color: '#64748b' }}>v{s.version || 1}</span>
                </div>
                {s.milestoneName && <p className="text-xs text-slate-500 mt-0.5">Milestone: {s.milestoneName}</p>}
              </div>
              <span className="text-xs text-slate-600 flex-shrink-0">{fmtDate(s.createdAt)}</span>
            </div>
            {s.files?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {s.files.map((f, i) => (
                  <a key={i} href={`${API_BASE.replace('/api', '')}${f.path}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-600 font-medium transition-colors"
                    style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /></svg>
                    {f.filename}
                  </a>
                ))}
              </div>
            )}
            {s.reviews?.length > 0 && (
              <div className="mb-1" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                {s.reviews.slice(0, 1).map(r => (
                  <div key={r.id} className="flex items-start gap-2">
                    <span className={`badge mt-0.5 ${r.approved === true ? 'badge-approved' : r.approved === false ? 'badge-rejected' : 'badge-pending'}`}>
                      {r.approved === true ? 'Approved' : r.approved === false ? 'Rejected' : 'Reviewed'}
                    </span>
                    <p className="text-xs text-slate-400">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
            <CommentThread submissionId={s.id} baseRoute="student" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
function StudentFeedback() {
  const api = useApi();
  const [data, setData] = useState({ milestones: [], submissions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/milestones').catch(() => []),
      api.get('/student/submissions').catch(() => []),
    ]).then(([m, s]) => setData({ milestones: m, submissions: s })).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const allFeedback = [
    ...data.milestones.flatMap(m => (m.reviews || []).map(r => ({ ...r, context: `Milestone: ${m.title}`, deadline: m.deadline }))),
    ...data.submissions.flatMap(s => (s.reviews || []).map(r => ({ ...r, context: `Submission: ${s.title}` }))),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Feedback</h2>
        <span className="badge badge-pending">{allFeedback.length} reviews</span>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : allFeedback.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-slate-500">No feedback received yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allFeedback.map((f, i) => (
            <div key={i} className="card-hover p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="text-xs text-slate-500 font-medium">{f.context}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${f.approved === true ? 'badge-approved' : f.approved === false ? 'badge-rejected' : 'badge-pending'}`}>
                    {f.approved === true ? 'Approved' : f.approved === false ? 'Rejected' : 'Comment'}
                  </span>
                  <span className="text-xs text-slate-600">{fmtDate(f.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{f.comment}</p>
              {f.mentor && <p className="text-xs text-slate-600 mt-2">— {f.mentor.name}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
function StudentAnnouncements() {
  const api = useApi();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/announcements').then(setAnnouncements).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Announcements</h2>
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : announcements.length === 0 ? (
        <div className="card p-16 text-center"><p className="text-slate-500">No announcements</p></div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="card-hover p-5">
              <div className="flex items-start gap-3 mb-2">
                {a.priority === 'BROADCAST' && <span className="badge badge-broadcast flex-shrink-0">Broadcast</span>}
                {a.priority === 'HIGH' && <span className="badge badge-high flex-shrink-0">High</span>}
                <h3 className="font-semibold text-slate-800">{a.title}</h3>
                <span className="ml-auto text-xs text-slate-600 flex-shrink-0">{fmtDate(a.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{a.content}</p>
              {a.coordinator && <p className="text-xs text-slate-600 mt-2">Posted by {a.coordinator.name}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
