const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');
const Milestone = require('../models/Milestone');
const Submission = require('../models/Submission');
const Feedback = require('../models/Feedback');
const Announcement = require('../models/Announcement');
const AuditLog = require('../models/AuditLog');
const PhaseConfig = require('../models/PhaseConfig');
const Task = require('../models/Task');
const logAction = require('../utils/auditLog');
const { validate, schemas } = require('../middleware/validate');
const Comment = require('../models/Comment');

router.use(authenticate, requireRole('COORDINATOR'));

// ─── Overview stats ───────────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const [totalTeams, activeTeams, pendingTeams, totalMentors, milestones, subIds, reviewedSubIds] = await Promise.all([
      Team.countDocuments(),
      Team.countDocuments({ status: 'ACTIVE' }),
      Team.countDocuments({ status: { $in: ['PENDING', 'MENTOR_APPROVED'] } }),
      User.countDocuments({ role: 'mentor' }),
      Milestone.find().select('status'),
      Submission.distinct('_id'),
      Feedback.distinct('submissionId', { submissionId: { $ne: null } }),
    ]);

    const reviewedSet = new Set(reviewedSubIds.map(id => id.toString()));
    const pendingReviews = subIds.filter(id => !reviewedSet.has(id.toString())).length;
    const approvedMilestones = milestones.filter(m => m.status === 'APPROVED').length;

    res.json({
      totalTeams, activeTeams, pendingTeams,
      totalMentors,
      totalMilestones: milestones.length,
      approvedMilestones,
      pendingReviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Teams ────────────────────────────────────────────────────────────────────
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find().populate('mentorId', 'id name email').sort({ createdAt: 1 });
    const teamIds = teams.map(t => t._id);

    const [milestones, submissions] = await Promise.all([
      Milestone.find({ teamId: { $in: teamIds } }).select('teamId status'),
      Submission.find({ teamId: { $in: teamIds } }).select('teamId'),
    ]);

    res.json(teams.map(t => {
      const tid = t._id.toString();
      return {
        id: t._id,
        teamCode: t.teamUniqueId,
        teamUniqueId: t.teamUniqueId,
        rollNumber: t.rollNumber,
        leader: t.leader,
        leaderName: t.leader.name,
        members: t.members,
        memberNames: t.members.map(m => m.name),
        projectTitle: t.projectTitle,
        projectDescription: t.projectDescription,
        project: t.projectTitle ? { title: t.projectTitle, description: t.projectDescription } : null,
        mentor: t.mentorId ? { id: t.mentorId._id, name: t.mentorId.name, email: t.mentorId.email } : null,
        mentorId: t.mentorId?._id || null,
        type: t.type,
        remark: t.remark,
        status: t.status,
        rejectionReason: t.rejectionReason,
        createdAt: t.createdAt,
        milestones: milestones.filter(m => m.teamId.toString() === tid).map(m => ({ id: m._id, status: m.status })),
        submissions: submissions.filter(s => s.teamId.toString() === tid).map(s => ({ id: s._id })),
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Teams awaiting coordinator activation (mentor approved)
router.get('/pending-teams', async (req, res) => {
  try {
    const teams = await Team.find({ status: 'MENTOR_APPROVED' })
      .populate('mentorId', 'id name email')
      .sort({ mentorApprovedAt: 1 });
    res.json(teams.map(t => ({
      id: t._id,
      teamCode: t.teamUniqueId,
      leaderName: t.leader.name,
      leader: t.leader,
      members: t.members,
      type: t.type,
      mentor: t.mentorId ? { id: t.mentorId._id, name: t.mentorId.name, email: t.mentorId.email } : null,
      mentorApprovedAt: t.mentorApprovedAt,
      createdAt: t.createdAt,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Activate a team (final coordinator approval)
router.post('/teams/:id/activate', async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.id, status: 'MENTOR_APPROVED' });
    if (!team) return res.status(404).json({ error: 'Team not found or not ready for activation' });

    team.status = 'ACTIVE';
    team.coordinatorActivatedAt = new Date();
    await team.save();

    await logAction({
      action: 'TEAM_COORDINATOR_ACTIVATED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'team',
      targetId: team._id,
      targetName: team.teamUniqueId,
      details: `Team ${team.teamUniqueId} activated by coordinator ${req.auth.name}`,
    });

    res.json({ id: team._id, status: team.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a team at coordinator level
router.post('/teams/:id/reject', async (req, res) => {
  const { reason } = req.body;
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    team.status = 'REJECTED';
    team.rejectionReason = reason?.trim() || 'Rejected by coordinator';
    await team.save();

    await logAction({
      action: 'TEAM_COORDINATOR_REJECTED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'team',
      targetId: team._id,
      targetName: team.teamUniqueId,
      details: reason?.trim() || 'No reason provided',
    });

    res.json({ id: team._id, status: team.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Revoke active status (send back to pending)
router.post('/teams/:id/revoke', async (req, res) => {
  const { reason } = req.body;
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const prevStatus = team.status;
    team.status = 'PENDING';
    team.rejectionReason = null;
    team.mentorApprovedAt = null;
    team.coordinatorActivatedAt = null;
    await team.save();

    await logAction({
      action: 'TEAM_STATUS_REVOKED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'team',
      targetId: team._id,
      targetName: team.teamUniqueId,
      details: `Status revoked from ${prevStatus} to PENDING. Reason: ${reason?.trim() || 'None'}`,
    });

    res.json({ id: team._id, status: team.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team remark/type
router.put('/teams/:id/remark', async (req, res) => {
  const { remark } = req.body;
  if (!remark?.trim()) return res.status(400).json({ error: 'remark is required' });
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { remark: remark.trim(), type: ['Internal', 'External'].includes(remark.trim()) ? remark.trim() : 'Internal' },
      { new: true }
    );
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ id: team._id, remark: team.remark, type: team.type });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Force reassign mentor (override)
router.post('/teams/:id/force-assign', async (req, res) => {
  const { mentorId } = req.body;
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const previousMentor = team.mentorId;

    if (mentorId) {
      const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
      if (!mentor) return res.status(400).json({ error: 'Mentor not found' });
    }

    team.mentorId = mentorId || null;
    if (mentorId) team.requestedMentorId = mentorId;
    await team.save();

    await logAction({
      action: 'MENTOR_FORCE_REASSIGNED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'team',
      targetId: team._id,
      targetName: team.teamUniqueId,
      details: `Previous mentor: ${previousMentor || 'none'}. New mentor: ${mentorId || 'none'}`,
    });

    const updated = await Team.findById(team._id).populate('mentorId', 'id name email');
    res.json({
      id: updated._id,
      teamCode: updated.teamUniqueId,
      mentor: updated.mentorId ? { id: updated.mentorId._id, name: updated.mentorId.name, email: updated.mentorId.email } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// View kanban for any team
router.get('/teams/:teamId/kanban', async (req, res) => {
  try {
    const tasks = await Task.find({ teamId: req.params.teamId }).sort({ order: 1, createdAt: 1 });
    res.json(tasks.map(taskToResponse));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Mentors ──────────────────────────────────────────────────────────────────
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor' }).select('-password');
    const assignedCounts = await Team.aggregate([
      { $match: { mentorId: { $ne: null } } },
      { $group: { _id: '$mentorId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    assignedCounts.forEach(a => { countMap[a._id.toString()] = a.count; });

    res.json(mentors.map(m => ({
      id: m._id,
      name: m.name,
      email: m.email,
      department: m.department,
      expertise: m.expertise,
      _count: { assignedTeams: countMap[m._id.toString()] || 0 },
    })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign mentor (non-force, standard)
router.post('/assign', async (req, res) => {
  const { teamId, mentorId } = req.body;
  if (!teamId) return res.status(400).json({ error: 'teamId required' });
  try {
    const team = await Team.findByIdAndUpdate(
      teamId,
      { mentorId: mentorId || null },
      { new: true }
    ).populate('mentorId', 'id name email');

    if (!team) return res.status(404).json({ error: 'Team not found' });

    await logAction({
      action: 'MENTOR_ASSIGNED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'team',
      targetId: team._id,
      targetName: team.teamUniqueId,
      details: `Mentor assigned: ${mentorId || 'none'}`,
    });

    res.json({
      id: team._id,
      teamCode: team.teamUniqueId,
      mentor: team.mentorId ? { id: team.mentorId._id, name: team.mentorId.name, email: team.mentorId.email } : null,
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Milestones ───────────────────────────────────────────────────────────────
router.get('/milestones', async (req, res) => {
  try {
    const milestones = await Milestone.find()
      .populate({
        path: 'teamId',
        select: 'id teamUniqueId leader projectTitle mentorId',
        populate: { path: 'mentorId', select: 'name' },
      })
      .sort({ deadline: 1 });

    const msIds = milestones.map(m => m._id);
    const feedbacks = await Feedback.find({ milestoneId: { $in: msIds } })
      .populate('mentorId', 'name')
      .sort({ createdAt: -1 });

    const fbByMs = {};
    feedbacks.forEach(f => {
      const key = f.milestoneId.toString();
      if (!fbByMs[key]) fbByMs[key] = [];
      fbByMs[key].push(f);
    });

    res.json(milestones.map(m => ({
      id: m._id,
      title: m.title,
      deadline: m.deadline,
      status: m.status,
      teamId: m.teamId?._id,
      createdAt: m.createdAt,
      team: m.teamId ? {
        id: m.teamId._id,
        teamCode: m.teamId.teamUniqueId,
        leaderName: m.teamId.leader?.name,
        projectTitle: m.teamId.projectTitle || null,
        mentorName: m.teamId.mentorId?.name || null,
      } : null,
      reviews: (fbByMs[m._id.toString()] || []).slice(0, 1).map(f => ({
        id: f._id,
        comment: f.comment,
        mentor: { name: f.mentorId?.name },
      })),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/milestones', async (req, res) => {
  const { title, deadline, teamId, teamIds } = req.body;
  if (!title?.trim() || !deadline) return res.status(400).json({ error: 'title and deadline required' });

  const targets = teamIds?.length ? teamIds : teamId ? [teamId] : [];
  if (!targets.length) return res.status(400).json({ error: 'teamId or teamIds required' });

  try {
    const created = await Promise.all(
      targets.map(tid =>
        Milestone.create({ title: title.trim(), deadline: new Date(deadline), teamId: tid, setBy: req.auth.id })
      )
    );

    await logAction({
      action: 'MILESTONE_CREATED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'milestone',
      targetId: created[0]._id,
      targetName: title.trim(),
      details: `Created for ${targets.length} team(s). Deadline: ${deadline}`,
    });

    res.status(201).json(created.map(m => ({
      id: m._id, title: m.title, deadline: m.deadline, status: m.status, teamId: m.teamId, createdAt: m.createdAt,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/milestones/:id', async (req, res) => {
  const { title, deadline, status } = req.body;
  try {
    const update = {};
    if (title?.trim()) update.title = title.trim();
    if (deadline) update.deadline = new Date(deadline);
    if (status) update.status = status;

    const milestone = await Milestone.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!milestone) return res.status(404).json({ error: 'Not found' });

    if (deadline) {
      await logAction({
        action: 'DEADLINE_EXTENDED',
        performedByName: req.auth.name,
        performedBy: req.auth.id,
        targetType: 'milestone',
        targetId: milestone._id,
        targetName: milestone.title,
        details: `New deadline: ${deadline}`,
      });
    }

    res.json({ id: milestone._id, title: milestone.title, deadline: milestone.deadline, status: milestone.status });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/milestones/:id', async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    await Feedback.deleteMany({ milestoneId: req.params.id });
    await Milestone.findByIdAndDelete(req.params.id);

    if (milestone) {
      await logAction({
        action: 'MILESTONE_DELETED',
        performedByName: req.auth.name,
        performedBy: req.auth.id,
        targetType: 'milestone',
        targetId: milestone._id,
        targetName: milestone.title,
      });
    }

    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Announcements ────────────────────────────────────────────────────────────
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('postedBy', 'name').sort({ createdAt: -1 });
    res.json(announcements.map(announcementToResponse));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/announcements', validate(schemas.announcementCreate), async (req, res) => {
  const { title, content, priority } = req.body;
  if (!title?.trim() || !content?.trim()) return res.status(400).json({ error: 'title and content required' });
  try {
    const validPriority = ['NORMAL', 'HIGH', 'BROADCAST'].includes(priority) ? priority : 'NORMAL';
    const a = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      postedBy: req.auth.id,
      priority: validPriority,
    });
    await a.populate('postedBy', 'name');

    await logAction({
      action: 'ANNOUNCEMENT_CREATED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'announcement',
      targetId: a._id,
      targetName: title.trim(),
      details: `Priority: ${validPriority}`,
    });

    res.status(201).json(announcementToResponse(a));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Phase Config ─────────────────────────────────────────────────────────────
const DEFAULT_PHASES = [
  { number: 0, name: 'Pre-Launch', description: 'System is in setup mode. Teams are registering.' },
  { number: 1, name: 'Phase 1 – Synopsis', description: 'Teams submit project synopsis documents.' },
  { number: 2, name: 'Phase 2 – Mid-Term', description: 'Mid-term review and progress evaluation.' },
  { number: 3, name: 'Phase 3 – Final', description: 'Final submissions and presentations.' },
];

router.get('/phase', async (req, res) => {
  try {
    let config = await PhaseConfig.findOne();
    if (!config) {
      config = await PhaseConfig.create({ currentPhase: 0, phases: DEFAULT_PHASES });
    }
    res.json({
      currentPhase: config.currentPhase,
      phases: config.phases,
      updatedAt: config.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/phase', validate(schemas.phaseUpdate), async (req, res) => {
  const { currentPhase, phases } = req.body;
  if (currentPhase === undefined || currentPhase < 0 || currentPhase > 3) {
    return res.status(400).json({ error: 'currentPhase must be 0–3' });
  }
  try {
    let config = await PhaseConfig.findOne();
    if (!config) {
      config = new PhaseConfig({ phases: DEFAULT_PHASES });
    }

    const previousPhase = config.currentPhase;
    config.currentPhase = currentPhase;
    if (phases && Array.isArray(phases)) config.phases = phases;
    config.updatedBy = req.auth.id;
    await config.save();

    await logAction({
      action: 'PHASE_CHANGED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'phase',
      details: `Phase changed from ${previousPhase} to ${currentPhase}`,
    });

    res.json({ currentPhase: config.currentPhase, phases: config.phases, updatedAt: config.updatedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
router.get('/submissions/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ submissionId: req.params.id }).sort({ createdAt: 1 });
    res.json(comments.map(c => ({ id: c._id, body: c.body, authorName: c.authorName, authorType: c.authorType, createdAt: c.createdAt })));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/audit-log', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    res.json({
      data: logs.map(l => ({
        id: l._id,
        action: l.action,
        performedByName: l.performedByName,
        targetType: l.targetType,
        targetName: l.targetName,
        details: l.details,
        createdAt: l.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function announcementToResponse(a) {
  return {
    id: a._id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    createdAt: a.createdAt,
    coordinator: a.postedBy ? { name: a.postedBy.name } : null,
  };
}

function taskToResponse(t) {
  return {
    id: t._id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignedTo: t.assignedTo,
    createdByName: t.createdByName,
    order: t.order,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

module.exports = router;
