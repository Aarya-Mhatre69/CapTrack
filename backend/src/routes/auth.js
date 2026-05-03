const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Team = require('../models/Team');
const User = require('../models/User');
const logAction = require('../utils/auditLog');
const { validate, schemas } = require('../middleware/validate');

const ROLL_RE = /^\d{7}$/;

async function generateSequentialTeamId() {
  const year = new Date().getFullYear();
  const teams = await Team.find({ teamUniqueId: { $regex: `^${year}` } })
    .select('teamUniqueId')
    .sort({ teamUniqueId: -1 })
    .limit(1);
  let seq = 1;
  if (teams.length > 0) {
    const lastSeq = parseInt(teams[0].teamUniqueId.slice(String(year).length), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${year}${String(seq).padStart(3, '0')}`;
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let p = '';
  for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

// Student team registration
router.post('/register/team', validate(schemas.teamRegister), async (req, res) => {
  const {
    leaderName, leaderRollNumber, leaderCgpi, leaderDepartment, leaderDivision,
    members, type, requestedMentorId,
  } = req.body;

  if (!leaderRollNumber?.trim() || !leaderName?.trim()) {
    return res.status(400).json({ error: 'leaderRollNumber and leaderName are required' });
  }
  if (!ROLL_RE.test(leaderRollNumber.trim())) {
    return res.status(400).json({ error: 'Leader roll number must be exactly 7 digits' });
  }

  const teamType = ['Internal', 'External'].includes(type) ? type : 'Internal';

  const validMembers = (Array.isArray(members) ? members : [])
    .filter(m => m?.name?.trim())
    .slice(0, 4);

  for (const m of validMembers) {
    if (m.rollNumber?.trim() && !ROLL_RE.test(m.rollNumber.trim())) {
      return res.status(400).json({ error: `Member "${m.name}" roll number must be exactly 7 digits` });
    }
  }

  try {
    const exists = await Team.findOne({ rollNumber: leaderRollNumber.trim() });
    if (exists) return res.status(409).json({ error: 'Roll number already registered' });

    if (requestedMentorId) {
      const mentor = await User.findOne({ _id: requestedMentorId, role: 'mentor' });
      if (!mentor) return res.status(400).json({ error: 'Selected mentor not found' });
    }

    const teamUniqueId = await generateSequentialTeamId();
    const plainPassword = generatePassword();
    const hashed = await bcrypt.hash(plainPassword, 10);

    const team = await Team.create({
      teamUniqueId,
      teamPassword: hashed,
      rollNumber: leaderRollNumber.trim(),
      leader: {
        name: leaderName.trim(),
        rollNumber: leaderRollNumber.trim(),
        cgpi: Math.min(10, Math.max(0, parseFloat(leaderCgpi) || 0)),
        department: leaderDepartment?.trim() || '',
        division: leaderDivision?.trim().toUpperCase() || '',
      },
      members: validMembers.map(m => ({
        name: m.name.trim(),
        rollNumber: m.rollNumber?.trim() || '',
        cgpi: Math.min(10, Math.max(0, parseFloat(m.cgpi) || 0)),
        division: m.division?.trim().toUpperCase() || '',
      })),
      type: teamType,
      remark: teamType,
      requestedMentorId: requestedMentorId || null,
      status: 'PENDING',
    });

    await logAction({
      action: 'TEAM_REGISTERED',
      performedByName: leaderName.trim(),
      performedByTeam: team._id,
      targetType: 'team',
      targetId: team._id,
      targetName: teamUniqueId,
      details: `Type: ${teamType}. Requested mentor: ${requestedMentorId || 'None'}`,
    });

    res.status(201).json({
      message: 'Registration successful! Save your Team ID and Password — you will need these to log in.',
      teamCode: teamUniqueId,
      password: plainPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mentor registration
router.post('/register/mentor', validate(schemas.mentorRegister), async (req, res) => {
  const { email, password, name, department, expertise } = req.body;
  if (!email?.trim() || !password || !name?.trim()) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  try {
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashed,
      name: name.trim(),
      role: 'mentor',
      department: department?.trim() || undefined,
      expertise: expertise?.trim() || undefined,
    });

    await logAction({
      action: 'MENTOR_REGISTERED',
      performedByName: name.trim(),
      performedBy: user._id,
      targetType: 'user',
      targetId: user._id,
      targetName: name.trim(),
    });

    res.status(201).json({ message: 'Mentor registered successfully. You can now sign in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Coordinator registration — requires Institution Master Key
router.post('/register/coordinator', validate(schemas.coordinatorRegister), async (req, res) => {
  const { email, password, name, department, institutionKey } = req.body;

  if (!institutionKey) {
    return res.status(400).json({ error: 'institutionKey is required' });
  }
  if (institutionKey !== process.env.INSTITUTION_MASTER_KEY) {
    return res.status(403).json({ error: 'Invalid Institution Master Key' });
  }
  if (!email?.trim() || !password || !name?.trim()) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  try {
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashed,
      name: name.trim(),
      role: 'coordinator',
      department: department?.trim() || undefined,
    });

    await logAction({
      action: 'COORDINATOR_REGISTERED',
      performedByName: name.trim(),
      performedBy: user._id,
      targetType: 'user',
      targetId: user._id,
      targetName: name.trim(),
      details: 'Registered via Institution Master Key',
    });

    res.status(201).json({ message: 'Coordinator account created. You can now sign in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Team login
router.post('/login/team', validate(schemas.teamLogin), async (req, res) => {
  const { teamCode, password } = req.body;
  if (!teamCode || !password) return res.status(400).json({ error: 'teamCode and password required' });
  try {
    const team = await Team.findOne({ teamUniqueId: teamCode.trim() })
      .populate('mentorId', 'id name email department')
      .populate('requestedMentorId', 'id name email department');

    if (!team) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, team.teamPassword);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { type: 'team', id: team._id, teamCode: team.teamUniqueId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const mentor = team.mentorId ? {
      id: team.mentorId._id,
      name: team.mentorId.name,
      email: team.mentorId.email,
      department: team.mentorId.department,
    } : null;

    const requestedMentor = team.requestedMentorId ? {
      id: team.requestedMentorId._id,
      name: team.requestedMentorId.name,
      email: team.requestedMentorId.email,
      department: team.requestedMentorId.department,
    } : null;

    res.json({
      token,
      user: {
        role: 'STUDENT',
        id: team._id,
        teamCode: team.teamUniqueId,
        teamUniqueId: team.teamUniqueId,
        name: team.leader.name,
        leaderName: team.leader.name,
        leader: team.leader,
        memberNames: team.members.map(m => m.name),
        members: team.members,
        projectTitle: team.projectTitle,
        projectDescription: team.projectDescription,
        mentor,
        requestedMentor,
        status: team.status,
        type: team.type,
        rejectionReason: team.rejectionReason,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login (Mentor / Coordinator)
router.post('/login/user', validate(schemas.userLogin), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const role = user.role.toUpperCase();
    const token = jwt.sign(
      { type: 'user', id: user._id, email: user.email, role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role, department: user.department, expertise: user.expertise },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public endpoint to list mentors (for team registration dropdown)
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor' }).select('_id name department expertise');
    res.json(mentors.map(m => ({ id: m._id, name: m.name, department: m.department, expertise: m.expertise })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
