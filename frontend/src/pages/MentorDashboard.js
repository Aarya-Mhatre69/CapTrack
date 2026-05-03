import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ─── Icons ────────────────────────────────────────────────────────────────────
const HomeIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const TeamsIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ReviewIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const AnnIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const ApprovalIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export default function MentorDashboard() {
  const api = useApi();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get('/mentor/pending-teams').then(t => setPendingCount(t.length)).catch(() => {});
  }, []); // eslint-disable-line

  const navItems = [
    { to: '/mentor', end: true, label: 'Overview', icon: <HomeIcon /> },
    { to: '/mentor/approvals', label: 'Pending Approvals', icon: <ApprovalIcon />, badge: pendingCount },
    { to: '/mentor/teams', label: 'My Teams', icon: <TeamsIcon /> },
    { to: '/mentor/submissions', label: 'Reviews', icon: <ReviewIcon /> },
    { to: '/mentor/announcements', label: 'Announcements', icon: <AnnIcon /> },
  ];

  return (
    <Layout navItems={navItems} title="Mentor Portal"
      quickActions={[
        { label: 'View Teams', icon: <TeamsIcon />, onClick: () => window.location.href = '/mentor/teams' },
        { label: 'Pending Approvals', icon: <ApprovalIcon />, onClick: () => window.location.href = '/mentor/approvals' },
      ]}>
      <Routes>
        <Route index element={<MentorHome pendingCount={pendingCount} />} />
        <Route path="approvals" element={<MentorApprovals onPendingChange={setPendingCount} />} />
        <Route path="teams" element={<MentorTeams />} />
        <Route path="submissions" element={<MentorSubmissions />} />
        <Route path="announcements" element={<MentorAnnouncements />} />
      </Routes>
    </Layout>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function MentorHome({ pendingCount }) {
  const api = useApi();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mentor/teams').then(setTeams).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const approvedMs = teams.flatMap(t => t.milestones || []).filter(m => m.status === 'APPROVED').length;
  const pendingRev = teams.flatMap(t => t.submissions || []).filter(s => !(s.reviews?.length)).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          <p className="text-sm text-amber-300 font-medium">{pendingCount} team{pendingCount !== 1 ? 's' : ''} awaiting your approval</p>
          <a href="/mentor/approvals" className="ml-auto text-xs font-semibold text-amber-600 hover:text-amber-300 transition-colors">Review →</a>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800">Welcome, {user?.name?.split(' ').slice(-1)[0] || 'Mentor'}</h2>
        <p className="text-slate-500 text-sm mt-1">{user?.department || 'Faculty'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Teams Assigned',    value: teams.length,  color: '#6366f1' },
          { label: 'Pending Approvals', value: pendingCount,  color: '#f59e0b' },
          { label: 'Milestones OK',     value: approvedMs,    color: '#10b981' },
          { label: 'Pending Reviews',   value: pendingRev,    color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{s.label}</p>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Assigned Teams</h3>
          {loading ? <Skeleton className="h-32 w-full" /> : teams.length === 0 ? (
            <p className="text-slate-500 text-sm">No teams assigned yet</p>
          ) : (
            <div className="space-y-3">
              {teams.map(t => {
                const progress = t.milestones?.length ? Math.round((t.milestones.filter(m => m.status === 'APPROVED').length / t.milestones.length) * 100) : 0;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-slate-800 flex-shrink-0"
                      style={{ background: '#e0e7ff' }}>{t.teamCode?.slice(-3)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.leaderName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e2e8f0' }}>
                          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#10b981)' }} />
                        </div>
                        <span className="text-xs text-slate-500">{progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Submissions Awaiting Review</h3>
          {loading ? <Skeleton className="h-32 w-full" /> : (() => {
            const pending = teams.flatMap(t => (t.submissions || []).filter(s => !s.reviews?.length).map(s => ({ ...s, teamName: t.leaderName })));
            return pending.length === 0 ? <p className="text-slate-500 text-sm">All submissions reviewed!</p> : (
              <div className="space-y-2">
                {pending.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                      <p className="text-xs text-slate-500">{s.teamName}</p>
                    </div>
                    <span className="badge badge-pending">Pending</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Pending Approvals ────────────────────────────────────────────────────────
function MentorApprovals({ onPendingChange }) {
  const api = useApi();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try { const t = await api.get('/mentor/pending-teams'); setTeams(t); onPendingChange(t.length); }
    catch { setTeams([]); } finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setActing(id);
    try { await api.post(`/mentor/approve-team/${id}`, {}); toast('Team approved — forwarded to coordinator', 'success'); load(); }
    catch (err) { toast(err.message, 'error'); } finally { setActing(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal);
    try { await api.post(`/mentor/reject-team/${rejectModal}`, { reason }); toast('Team rejected', 'info'); setRejectModal(null); setReason(''); load(); }
    catch (err) { toast(err.message, 'error'); } finally { setActing(null); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Pending Approvals</h2>
        <span className="badge badge-pending">{teams.length} pending</span>
      </div>

      {loading ? <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
        : teams.length === 0 ? (
          <div className="card p-16 text-center">
            <svg className="w-12 h-12 text-emerald-700/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-slate-500">No pending approvals — all clear!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map(t => (
              <div key={t.id} className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-indigo-600 font-bold">{t.teamCode}</span>
                  <span className={`badge ${t.type === 'External' ? 'badge-external' : 'badge-internal'}`}>{t.type || 'Internal'}</span>
                  <span className="text-xs text-slate-600 ml-auto">Registered {fmtDate(t.createdAt)}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="text-xs text-slate-500 mb-1">Leader</p>
                    <p className="text-sm font-bold text-slate-800">{t.leader.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.leader.department} · Div {t.leader.division} · CGPI {t.leader.cgpi}</p>
                  </div>
                  {t.members?.length > 0 && (
                    <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <p className="text-xs text-slate-500 mb-1">Members ({t.members.length})</p>
                      {t.members.map((m, i) => <p key={i} className="text-xs text-slate-700">{m.name}</p>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => approve(t.id)} disabled={acting === t.id} className="btn-success text-sm">
                    {acting === t.id ? 'Processing…' : '✓ Approve'}
                  </button>
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
            <p className="text-sm text-slate-400 mb-4">Provide a reason (optional):</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} className="input resize-none mb-4" rows={3} placeholder="e.g. Incomplete information…" />
            <div className="flex gap-3">
              <button onClick={reject} disabled={acting === rejectModal} className="btn-danger flex-1">{acting === rejectModal ? 'Rejecting…' : 'Confirm Reject'}</button>
              <button onClick={() => { setRejectModal(null); setReason(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── My Teams ─────────────────────────────────────────────────────────────────
function MentorTeams() {
  const api = useApi();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [kanbanTeamId, setKanbanTeamId] = useState(null);
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ comment: '', submissionId: null, milestoneId: null });
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    api.get('/mentor/teams').then(setTeams).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadKanban = async (teamId) => {
    setKanbanTeamId(teamId); setKanbanLoading(true);
    try { setKanbanTasks(await api.get(`/mentor/teams/${teamId}/kanban`)); }
    catch { setKanbanTasks([]); } finally { setKanbanLoading(false); }
  };

  const submitReview = async (approved) => {
    if (!reviewForm.comment.trim()) { toast('Comment is required', 'warning'); return; }
    setReviewing(true);
    try {
      const body = { comment: reviewForm.comment, approved };
      if (reviewForm.submissionId) body.submissionId = reviewForm.submissionId;
      if (reviewForm.milestoneId) body.milestoneId = reviewForm.milestoneId;
      await api.post('/mentor/reviews', body);
      toast('Review posted', 'success');
      setReviewForm({ comment: '', submissionId: null, milestoneId: null });
      const updated = await api.get('/mentor/teams');
      setTeams(updated);
      if (selected) setSelected(updated.find(t => t.id === selected.id) || null);
    } catch (err) { toast(err.message, 'error'); } finally { setReviewing(false); }
  };

  const KANBAN_COLS = [
    { key: 'TODO', label: 'To Do', color: '#6366f1' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b' },
    { key: 'REVIEW', label: 'Review', color: '#8b5cf6' },
    { key: 'DONE', label: 'Done', color: '#10b981' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-6">My Teams</h2>
      {loading ? <div className="grid md:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
        : teams.length === 0 ? <div className="card p-16 text-center"><p className="text-slate-500">No teams assigned</p></div>
        : (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {teams.map(t => {
              const progress = t.milestones?.length ? Math.round((t.milestones.filter(m => m.status === 'APPROVED').length / t.milestones.length) * 100) : 0;
              return (
                <button key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)}
                  className={`card-hover p-4 text-left ${selected?.id === t.id ? 'ring-1 ring-indigo-500' : ''}`}
                  style={selected?.id === t.id ? { background: '#eef2ff' } : {}}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-slate-800 flex-shrink-0" style={{ background: '#e0e7ff' }}>
                      {t.teamCode?.slice(-3)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{t.leaderName}</p>
                      <p className="text-xs text-slate-500 font-mono">{t.teamCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e2e8f0' }}>
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#10b981)' }} />
                    </div>
                    <span className="text-xs text-slate-500">{progress}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`badge ${t.type === 'External' ? 'badge-external' : 'badge-internal'} text-xs`}>{t.type || 'Internal'}</span>
                    <button onClick={e => { e.stopPropagation(); loadKanban(t.id); }}
                      className="text-xs text-indigo-600 hover:text-indigo-300 font-semibold transition-colors">Board →</button>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      {kanbanTeamId && (
        <div className="card p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Task Board — {teams.find(t => t.id === kanbanTeamId)?.leaderName}</h3>
            <button onClick={() => setKanbanTeamId(null)} className="btn-icon"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          {kanbanLoading ? <div className="grid grid-cols-4 gap-3">{KANBAN_COLS.map(c => <Skeleton key={c.key} className="h-32" />)}</div> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KANBAN_COLS.map(col => {
                const colTasks = kanbanTasks.filter(t => t.status === col.key);
                return (
                  <div key={col.key} className="kanban-col p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-bold text-slate-800">{col.label}</span>
                      <span className="ml-auto text-xs text-slate-600">{colTasks.length}</span>
                    </div>
                    {colTasks.length === 0 ? <p className="text-xs text-slate-700 text-center py-4">Empty</p>
                      : colTasks.map(task => (
                        <div key={task.id} className="kanban-card p-2.5 mb-2 cursor-default">
                          <p className="text-xs font-semibold text-slate-800 mb-1">{task.title}</p>
                          {task.assignedTo && <p className="text-xs text-slate-600">@{task.assignedTo}</p>}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <h3 className="text-lg font-bold text-slate-800">{selected.leaderName}</h3>
            <span className="font-mono text-indigo-600 text-sm">{selected.teamCode}</span>
          </div>

          {(selected.milestones || []).length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Milestones</p>
              <div className="space-y-2">
                {selected.milestones.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{m.title}</p>
                      <p className="text-xs text-slate-500">{fmtDate(m.deadline)}</p>
                    </div>
                    <span className={`badge ${m.status === 'APPROVED' ? 'badge-approved' : m.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>{m.status}</span>
                    {m.status === 'PENDING' && (
                      <button onClick={() => setReviewForm({ comment: '', milestoneId: m.id, submissionId: null })}
                        className="text-xs text-indigo-600 hover:text-indigo-300 font-semibold transition-colors">Review</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(selected.submissions || []).length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Submissions</p>
              <div className="space-y-2">
                {selected.submissions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                    </div>
                    <span className={`badge ${s.reviews?.length ? 'badge-approved' : 'badge-pending'}`}>{s.reviews?.length ? 'Reviewed' : 'Pending'}</span>
                    <button onClick={() => setReviewForm({ comment: '', submissionId: s.id, milestoneId: null })}
                      className="text-xs text-indigo-600 hover:text-indigo-300 font-semibold transition-colors">Review</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(reviewForm.submissionId || reviewForm.milestoneId) && (
            <div className="p-4 rounded-xl animate-fade-in" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Post Review</p>
              <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                className="input resize-none mb-3" rows={3} placeholder="Your feedback…" />
              <div className="flex gap-3">
                <button onClick={() => submitReview(true)}  disabled={reviewing} className="btn-success text-sm">✓ Approve</button>
                <button onClick={() => submitReview(false)} disabled={reviewing} className="btn-danger text-sm">✕ Reject</button>
                <button onClick={() => submitReview(null)}  disabled={reviewing} className="btn-secondary text-sm">Comment</button>
                <button onClick={() => setReviewForm({ comment: '', submissionId: null, milestoneId: null })} className="btn-icon ml-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Comment Thread ───────────────────────────────────────────────────────────
function CommentThread({ submissionId }) {
  const api = useApi();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setComments(await api.get(`/mentor/submissions/${submissionId}/comments`)); }
    catch {} finally { setLoading(false); }
  };

  const toggle = () => { if (!open) load(); setOpen(o => !o); };

  const post = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      const c = await api.post(`/mentor/submissions/${submissionId}/comments`, { body: body.trim() });
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
        {!open && comments.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-emerald-600 font-bold" style={{ background: '#ecfdf5', fontSize: 10 }}>{comments.length}</span>}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="text-xs text-slate-400 py-2 text-center animate-pulse">Loading…</div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">No comments yet.</div>
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
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent transition-all" />
            <button type="submit" disabled={posting || !body.trim()}
              className="text-xs px-3 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40"
              style={{ background: '#ecfdf5', color: '#059669' }}>
              {posting ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Submissions ──────────────────────────────────────────────────────────────
function MentorSubmissions() {
  const api = useApi();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ comment: '', submissionId: null });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setTeams(await api.get('/mentor/teams')); } catch {} finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const all = teams.flatMap(t => (t.submissions || []).map(s => ({ ...s, teamName: t.leaderName, teamCode: t.teamCode })));
  const unreviewed = all.filter(s => !s.reviews?.length);
  const reviewed   = all.filter(s => s.reviews?.length);

  const submit = async (submissionId, approved) => {
    if (!form.comment.trim()) { toast('Comment required', 'warning'); return; }
    setSaving(true);
    try {
      await api.post('/mentor/reviews', { comment: form.comment, approved, submissionId });
      toast('Review submitted', 'success');
      setForm({ comment: '', submissionId: null });
      load();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800">Reviews</h2>
        {unreviewed.length > 0 && <span className="badge badge-pending">{unreviewed.length} pending</span>}
      </div>

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div> : (
        <>
          {unreviewed.map(s => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{s.title}</p>
                    {s.version > 1 && <span className="text-xs px-1.5 py-0.5 rounded-full font-mono font-semibold" style={{ background: '#f1f5f9', color: '#64748b' }}>v{s.version}</span>}
                  </div>
                  <p className="text-xs text-slate-500">{s.teamName} · {s.teamCode}</p>
                </div>
                <span className="badge badge-pending">Pending</span>
              </div>
              {s.files?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {s.files.map((f, i) => (
                    <a key={i} href={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')}${f.path}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-600 font-medium"
                      style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /></svg>
                      {f.filename}
                    </a>
                  ))}
                </div>
              )}
              {form.submissionId === s.id ? (
                <div className="space-y-3 mt-2 p-4 rounded-xl" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                  <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} className="input resize-none" rows={3} placeholder="Your feedback…" />
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => submit(s.id, true)}  disabled={saving} className="btn-success text-sm">✓ Approve</button>
                    <button onClick={() => submit(s.id, false)} disabled={saving} className="btn-danger text-sm">✕ Reject</button>
                    <button onClick={() => submit(s.id, null)}  disabled={saving} className="btn-secondary text-sm">Comment only</button>
                    <button onClick={() => setForm({ comment: '', submissionId: null })} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setForm({ comment: '', submissionId: s.id })} className="btn-primary text-sm">Write Review</button>
              )}
              <CommentThread submissionId={s.id} />
            </div>
          ))}
          {reviewed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Already Reviewed</p>
              {reviewed.map(s => (
                <div key={s.id} className="card-hover p-4 mb-2">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                        {s.version > 1 && <span className="text-xs px-1.5 py-0.5 rounded-full font-mono font-semibold" style={{ background: '#f1f5f9', color: '#64748b' }}>v{s.version}</span>}
                      </div>
                      <p className="text-xs text-slate-500">{s.teamName}</p>
                    </div>
                    <span className={`badge ${s.reviews[0]?.approved === true ? 'badge-approved' : s.reviews[0]?.approved === false ? 'badge-rejected' : 'badge-approved'}`}>
                      {s.reviews[0]?.approved === true ? 'Approved' : s.reviews[0]?.approved === false ? 'Rejected' : 'Commented'}
                    </span>
                  </div>
                  <CommentThread submissionId={s.id} />
                </div>
              ))}
            </div>
          )}
          {all.length === 0 && <div className="card p-16 text-center"><p className="text-slate-500">No submissions yet</p></div>}
        </>
      )}
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
function MentorAnnouncements() {
  const api = useApi();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mentor/announcements').then(setAnnouncements).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Announcements</h2>
      {loading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        : announcements.length === 0 ? <div className="card p-16 text-center"><p className="text-slate-500">No announcements</p></div>
        : (
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
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
