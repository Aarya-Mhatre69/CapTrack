import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ROLL_RE = /^\d{7}$/;

// ─── Inline field error ────────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-400">{msg}</p>;
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">{children}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState('team');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mentors, setMentors] = useState([]);

  const [teamLogin, setTeamLogin] = useState({ teamCode: '', password: '' });
  const [userLogin, setUserLogin] = useState({ email: '', password: '' });

  const [teamReg, setTeamReg] = useState({
    leaderName: '', leaderRollNumber: '', leaderCgpi: '',
    leaderDepartment: '', leaderDivision: '',
    type: 'Internal', requestedMentorId: '',
    members: [{ name: '', rollNumber: '', cgpi: '', division: '' }],
  });

  const [mentorReg, setMentorReg] = useState({ email: '', password: '', name: '', department: '', expertise: '' });
  const [coordReg, setCoordReg] = useState({ email: '', password: '', name: '', department: '', institutionKey: '' });

  const [staffSubTab, setStaffSubTab] = useState('mentor'); // 'mentor' | 'coordinator'
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetch(`${API}/auth/mentors`)
      .then(r => r.ok ? r.json() : [])
      .then(setMentors)
      .catch(() => {});
  }, []);

  const switchTab = (t) => { setTab(t); setMode('login'); setError(''); setCredentials(null); setFieldErrors({}); };
  const switchMode = (m) => { setMode(m); setError(''); setCredentials(null); setFieldErrors({}); };

  // ── Team login ───────────────────────────────────────────────────────────────
  const handleTeamLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login/team`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamLogin),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      login(data.token, data.user);
      navigate('/student');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Staff login ──────────────────────────────────────────────────────────────
  const handleUserLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login/user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userLogin),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      login(data.token, data.user);
      navigate(data.user.role === 'COORDINATOR' ? '/coordinator' : '/mentor');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Team registration ────────────────────────────────────────────────────────
  const handleTeamRegister = async (e) => {
    e.preventDefault();
    setError(''); setFieldErrors({});

    const errs = {};
    if (!ROLL_RE.test(teamReg.leaderRollNumber.trim())) errs.leaderRollNumber = 'Must be exactly 7 digits';
    const validMembers = teamReg.members.filter(m => m.name.trim());
    for (const m of validMembers) {
      if (m.rollNumber.trim() && !ROLL_RE.test(m.rollNumber.trim()))
        errs[`member_${m.name}`] = `"${m.name}" roll number must be 7 digits`;
    }
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register/team`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderName: teamReg.leaderName.trim(),
          leaderRollNumber: teamReg.leaderRollNumber.trim(),
          leaderCgpi: teamReg.leaderCgpi,
          leaderDepartment: teamReg.leaderDepartment.trim(),
          leaderDivision: teamReg.leaderDivision.trim().toUpperCase(),
          type: teamReg.type,
          requestedMentorId: teamReg.requestedMentorId || null,
          members: validMembers.map(m => ({
            name: m.name.trim(), rollNumber: m.rollNumber.trim(), cgpi: m.cgpi, division: m.division.trim().toUpperCase(),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setCredentials({ teamCode: data.teamCode, password: data.password });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Mentor registration ──────────────────────────────────────────────────────
  const handleMentorRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register/mentor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mentorReg),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      switchMode('login');
      setUserLogin({ email: mentorReg.email, password: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Coordinator registration ─────────────────────────────────────────────────
  const handleCoordRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register/coordinator`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coordReg),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      switchMode('login');
      setUserLogin({ email: coordReg.email, password: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const addMember = () => {
    if (teamReg.members.length >= 4) return;
    setTeamReg(p => ({ ...p, members: [...p.members, { name: '', rollNumber: '', cgpi: '', division: '' }] }));
  };
  const removeMember = (i) => setTeamReg(p => ({ ...p, members: p.members.filter((_, idx) => idx !== i) }));
  const updateMember = (i, field, value) =>
    setTeamReg(p => ({ ...p, members: p.members.map((m, idx) => idx === i ? { ...m, [field]: value } : m) }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-50">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-glow"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <svg className="w-7 h-7 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Capstone Project Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Fr. CRIT · Academic Year 2025–2026</p>
        </div>

        {/* Card */}
        <div className="glass-modal p-0 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b" style={{ borderColor: '#e2e8f0' }}>
            {[['team', 'Student Team'], ['staff', 'Mentor / Coordinator']].map(([key, label]) => (
              <button key={key} onClick={() => switchTab(key)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 ${tab === key
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-700'}`}
                style={{ borderBottom: tab === key ? '2px solid #6366f1' : '2px solid transparent', marginBottom: '-1px' }}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm text-red-300"
                style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Credentials after team registration */}
            {credentials && (
              <div className="rounded-xl p-5 mb-5" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-emerald-400">Registration Successful!</span>
                </div>
                <p className="text-xs text-red-400 font-medium mb-4 leading-relaxed">
                  Save these credentials now. They cannot be recovered if lost.
                </p>
                <div className="space-y-2 mb-4">
                  {[['Team ID', credentials.teamCode], ['Password', credentials.password]].map(([label, val]) => (
                    <div key={label} className="rounded-xl px-4 py-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                      <div className="font-mono font-bold text-slate-800 text-xl tracking-wider">{val}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-400/80 mb-4">
                  Your team is <strong>Pending</strong> — a mentor must approve your registration before you can access all features.
                </p>
                <button onClick={() => { setTeamLogin({ teamCode: credentials.teamCode, password: '' }); setCredentials(null); setMode('login'); }}
                  className="btn-primary w-full text-sm">
                  Go to Login
                </button>
              </div>
            )}

            {/* ── Team Login ─────────────────────────────────────────────────── */}
            {!credentials && tab === 'team' && mode === 'login' && (
              <form onSubmit={handleTeamLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Team ID</label>
                  <input type="text" required value={teamLogin.teamCode}
                    onChange={e => setTeamLogin({ ...teamLogin, teamCode: e.target.value })}
                    className="input" placeholder="e.g. 2026001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                  <input type="password" required value={teamLogin.password}
                    onChange={e => setTeamLogin({ ...teamLogin, password: e.target.value })}
                    className="input" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? 'Signing in…' : 'Sign In as Team'}
                </button>
                <div className="pt-4 text-center" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <p className="text-xs text-slate-600 mb-2.5">Quick-fill demo accounts</p>
                  <div className="flex gap-2 justify-center">
                    {[['Team 2026001', '2026001', 'Pass1234'], ['Team 2026002', '2026002', 'Pass5678']].map(([label, code, pass]) => (
                      <button key={code} type="button" onClick={() => setTeamLogin({ teamCode: code, password: pass })}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium text-indigo-600 transition-colors"
                        style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* ── Team Registration ──────────────────────────────────────────── */}
            {!credentials && tab === 'team' && mode === 'register' && (
              <form onSubmit={handleTeamRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <SectionLabel>Leader Details</SectionLabel>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name <span className="text-red-400">*</span></label>
                    <input required value={teamReg.leaderName} onChange={e => setTeamReg({ ...teamReg, leaderName: e.target.value })} className="input" placeholder="Leader's full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Roll Number <span className="text-red-400">*</span></label>
                    <input required value={teamReg.leaderRollNumber}
                      onChange={e => setTeamReg({ ...teamReg, leaderRollNumber: e.target.value })}
                      className={`input ${fieldErrors.leaderRollNumber ? 'input-error' : ''}`}
                      placeholder="7-digit roll number" maxLength={7} pattern="\d{7}" />
                    <FieldError msg={fieldErrors.leaderRollNumber} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">CGPI</label>
                      <input type="number" step="0.1" min="0" max="10" value={teamReg.leaderCgpi}
                        onChange={e => setTeamReg({ ...teamReg, leaderCgpi: e.target.value })}
                        className="input" placeholder="e.g. 8.5" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Division <span className="text-red-400">*</span></label>
                      <input required value={teamReg.leaderDivision}
                        onChange={e => setTeamReg({ ...teamReg, leaderDivision: e.target.value.toUpperCase() })}
                        className="input" placeholder="A/B/C/D" maxLength={1} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Department <span className="text-red-400">*</span></label>
                    <input required value={teamReg.leaderDepartment} onChange={e => setTeamReg({ ...teamReg, leaderDepartment: e.target.value })} className="input" placeholder="e.g. Computer Engineering" />
                  </div>
                </div>

                <SectionLabel>Team Classification</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  {['Internal', 'External'].map(t => (
                    <button key={t} type="button" onClick={() => setTeamReg(p => ({ ...p, type: t }))}
                      className={`py-3 rounded-lg text-sm font-semibold transition-all duration-200 border ${teamReg.type === t
                        ? 'text-indigo-700 border-indigo-300 bg-indigo-50'
                        : 'text-slate-500 border-slate-200 bg-white hover:text-slate-700 hover:border-slate-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>

                <SectionLabel>Preferred Mentor</SectionLabel>
                <select value={teamReg.requestedMentorId} onChange={e => setTeamReg(p => ({ ...p, requestedMentorId: e.target.value }))}
                  className="input" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <option value="">— Select a mentor (optional) —</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.id} style={{ background: 'white' }}>
                      {m.name}{m.department ? ` · ${m.department}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">Your team will appear in the selected mentor's approval queue.</p>

                <SectionLabel>Team Members (up to 4)</SectionLabel>
                <div className="space-y-3">
                  {teamReg.members.map((member, i) => (
                    <div key={i} className="p-3 rounded-xl space-y-2"
                      style={{ background: '#f8fafc', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Member {i + 1}</span>
                        {teamReg.members.length > 1 && (
                          <button type="button" onClick={() => removeMember(i)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                        )}
                      </div>
                      <input value={member.name} onChange={e => updateMember(i, 'name', e.target.value)} className="input text-sm" placeholder="Full name" />
                      <input value={member.rollNumber} onChange={e => updateMember(i, 'rollNumber', e.target.value)} className={`input text-sm ${fieldErrors[`member_${member.name}`] ? 'input-error' : ''}`} placeholder="Roll number (7 digits)" maxLength={7} />
                      <FieldError msg={fieldErrors[`member_${member.name}`]} />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="0.1" min="0" max="10" value={member.cgpi} onChange={e => updateMember(i, 'cgpi', e.target.value)} className="input text-sm" placeholder="CGPI" />
                        <input value={member.division} onChange={e => updateMember(i, 'division', e.target.value.toUpperCase())} className="input text-sm" placeholder="Div (A/B/C/D)" maxLength={1} />
                      </div>
                    </div>
                  ))}
                  {teamReg.members.length < 4 && (
                    <button type="button" onClick={addMember} className="text-sm text-indigo-600 hover:text-indigo-300 font-medium transition-colors">+ Add Member</button>
                  )}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? 'Registering…' : 'Register Team'}
                </button>
              </form>
            )}

            {/* ── Staff Login ─────────────────────────────────────────────────── */}
            {!credentials && tab === 'staff' && mode === 'login' && (
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                  <input type="email" required value={userLogin.email} onChange={e => setUserLogin({ ...userLogin, email: e.target.value })} className="input" placeholder="you@crit.edu" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                  <input type="password" required value={userLogin.password} onChange={e => setUserLogin({ ...userLogin, password: e.target.value })} className="input" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <div className="pt-4 text-center" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <p className="text-xs text-slate-600 mb-2.5">Quick-fill (password: password123)</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {[
                      { label: 'Dr. Smitha', email: 'smitha.dange@capstone.edu' },
                      { label: 'Mrs. Chetana', email: 'chetana@capstone.edu' },
                      { label: 'Mrs. Nupur', email: 'nupur@capstone.edu' },
                    ].map(a => (
                      <button key={a.email} type="button" onClick={() => setUserLogin({ email: a.email, password: 'password123' })}
                        className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
                        className="bg-slate-50 border border-slate-200 rounded-xl">
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* ── Staff Registration ──────────────────────────────────────────── */}
            {tab === 'staff' && mode === 'register' && (
              <div>
                {/* Sub-tab */}
                <div className="flex rounded-lg p-1 mb-5 bg-slate-100 border border-slate-200">
                  {[['mentor', 'Mentor'], ['coordinator', 'Coordinator']].map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setStaffSubTab(key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${staffSubTab === key ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                      style={staffSubTab === key ? { background: '#eef2ff', border: '1px solid #c7d2fe' } : {}}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Mentor registration form */}
                {staffSubTab === 'mentor' && (
                  <form onSubmit={handleMentorRegister} className="space-y-4">
                    {[
                      ['Full Name *', 'text', 'name', 'e.g. Dr. Priya Sharma'],
                      ['Email *', 'email', 'email', 'you@crit.edu'],
                      ['Password *', 'password', 'password', 'Min. 6 characters'],
                      ['Department', 'text', 'department', 'e.g. Computer Engineering'],
                      ['Expertise', 'text', 'expertise', 'e.g. Machine Learning, Web Dev'],
                    ].map(([label, type, field, placeholder]) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
                        <input type={type} required={label.includes('*')} minLength={field === 'password' ? 6 : undefined}
                          value={mentorReg[field]} onChange={e => setMentorReg({ ...mentorReg, [field]: e.target.value })}
                          className="input" placeholder={placeholder} />
                      </div>
                    ))}
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? 'Registering…' : 'Register as Mentor'}
                    </button>
                  </form>
                )}

                {/* Coordinator registration form */}
                {staffSubTab === 'coordinator' && (
                  <form onSubmit={handleCoordRegister} className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-xs text-amber-300 leading-relaxed">
                        Coordinator registration requires the <strong>Institution Master Key</strong>. Contact your system administrator to obtain it.
                      </p>
                    </div>
                    {[
                      ['Full Name *', 'text', 'name', 'e.g. Prof. Alka Patel', coordReg, setCoordReg],
                      ['Email *', 'email', 'email', 'you@crit.edu', coordReg, setCoordReg],
                      ['Password *', 'password', 'password', 'Min. 6 characters', coordReg, setCoordReg],
                      ['Department', 'text', 'department', 'e.g. Computer Engineering', coordReg, setCoordReg],
                    ].map(([label, type, field, placeholder, state, setter]) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
                        <input type={type} required={label.includes('*')} minLength={field === 'password' ? 6 : undefined}
                          value={state[field]} onChange={e => setter({ ...state, [field]: e.target.value })}
                          className="input" placeholder={placeholder} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-amber-400 mb-1.5 uppercase tracking-wider">Institution Master Key *</label>
                      <input type="password" required value={coordReg.institutionKey} onChange={e => setCoordReg({ ...coordReg, institutionKey: e.target.value })}
                        className="input" placeholder="Enter the institution master key" />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? 'Verifying…' : 'Register as Coordinator'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Mode toggle links */}
            {!credentials && (
              <div className="mt-5 text-center text-sm text-slate-500">
                {tab === 'team' && mode === 'login' && (
                  <span>New team? <button onClick={() => switchMode('register')} className="text-indigo-600 font-semibold hover:text-indigo-300 transition-colors">Register here</button></span>
                )}
                {tab === 'team' && mode === 'register' && (
                  <span>Already registered? <button onClick={() => switchMode('login')} className="text-indigo-600 font-semibold hover:text-indigo-300 transition-colors">Sign in</button></span>
                )}
                {tab === 'staff' && mode === 'login' && (
                  <span>New to the portal? <button onClick={() => switchMode('register')} className="text-indigo-600 font-semibold hover:text-indigo-300 transition-colors">Register here</button></span>
                )}
                {tab === 'staff' && mode === 'register' && (
                  <span>Already registered? <button onClick={() => switchMode('login')} className="text-indigo-600 font-semibold hover:text-indigo-300 transition-colors">Sign in</button></span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 space-x-4">
          <Link to="/about" className="hover:text-slate-600 transition-colors">About</Link>
          <span>·</span>
          <span>© 2026 Capstone Project Monitoring System</span>
        </div>
      </div>
    </div>
  );
}
