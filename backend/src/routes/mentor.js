const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');
const Milestone = require('../models/Milestone');
const Submission = require('../models/Submission');
const Feedback = require('../models/Feedback');
const Announcement = require('../models/Announcement');
const Task = require('../models/Task');
const logAction = require('../utils/auditLog');
const Comment = require('../models/Comment');

router.use(authenticate, requireRole('MENTOR'));

// Mentor profile
router.get('/me', async (req, res) => {
  try {
    const mentor = await User.findById(req.auth.id).select('-password');
    if (!mentor) return res.status(404).json({ error: 'Not found' });
    const teamCount = await Team.countDocuments({ mentorId: req.auth.id });
    const pendingCount = await Team.countDocuments({ requestedMentorId: req.auth.id, status: 'PENDING' });
    res.json({
      id: mentor._id,
      email: mentor.email,
      name: mentor.name,
      role: mentor.role.toUpperCase(),
      department: mentor.department,
      expertise: mentor.expertise,
      _count: { assignedTeams: teamCount, pendingApprovals: pendingCount },
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Teams pending this mentor's approval
router.get('/pending-teams', async (req, res) => {
  try {
    const teams = await Team.find({ requestedMentorId: req.auth.id, status: 'PENDING' })
      .sort({ createdAt: 1 });
    res.json(teams.map(teamToResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve a pending team
router.post('/approve-team/:id', async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.id, requestedMentorId: req.auth.id, status: 'PENDING' });
    if (!team) return res.status(404).json({ error: 'Pending team not found or already actioned' });

    team.status = 'MENTOR_APPROVED';
    team.mentorId = req.auth.id;
    team.mentorApprovedAt = new Date();
    await team.save();

    await logAction({
      action: 'TEAM_MENTOR_APPROVED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: 'team',
      targetId: team._id,
      targetName: team.teamUniqueId,
      details: `Mentor ${req.auth.name} approved team ${team.teamUniqueId}. Forwarded to Coordinator.`,
    });

    res.json({ id: team._id, status: team.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a pending team
router.post('/reject-team/:id', async (req, res) => {
  const { reason } = req.body;
  try {
    const team = await Team.findOne({ _id: req.params.id, requestedMentorId: req.auth.id, status: 'PENDING' });
    if (!team) return res.status(404).json({ error: 'Pending team not found or already actioned' });

    team.status = 'REJECTED';
    team.rejectionReason = reason?.trim() || 'Rejected by mentor';
    await team.save();

    await logAction({
      action: 'TEAM_MENTOR_REJECTED',
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

// Assigned teams with full details
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find({ mentorId: req.auth.id });
    const teamIds = teams.map(t => t._id);

    const [milestones, submissions, allFeedback] = await Promise.all([
      Milestone.find({ teamId: { $in: teamIds } }).sort({ deadline: 1 }),
      Submission.find({ teamId: { $in: teamIds } }).sort({ createdAt: -1 }),
      Feedback.find({ teamId: { $in: teamIds } }).populate('mentorId', 'id name').sort({ createdAt: -1 }),
    ]);

    res.json(teams.map(team => {
      const tid = team._id.toString();
      const teamMilestones = milestones.filter(m => m.teamId.toString() === tid);
      const teamSubmissions = submissions.filter(s => s.teamId.toString() === tid);

      return {
        id: team._id,
        teamCode: team.teamUniqueId,
        teamUniqueId: team.teamUniqueId,
        rollNumber: team.rollNumber,
        leader: team.leader,
        leaderName: team.leader.name,
        members: team.members,
        memberNames: team.members.map(m => m.name),
        projectTitle: team.projectTitle,
        projectDescription: team.projectDescription,
        project: team.projectTitle ? { title: team.projectTitle, description: team.projectDescription } : null,
        status: team.status,
        type: team.type,
        createdAt: team.createdAt,
        milestones: teamMilestones.map(m => ({
          id: m._id,
          title: m.title,
          deadline: m.deadline,
          status: m.status,
          teamId: m.teamId,
          createdAt: m.createdAt,
          reviews: allFeedback
            .filter(f => f.milestoneId?.toString() === m._id.toString())
            .map(f => ({ id: f._id, comment: f.comment, approved: f.approved, createdAt: f.createdAt, mentor: { id: f.mentorId._id, name: f.mentorId.name } })),
        })),
        submissions: teamSubmissions.map(s => ({
          id: s._id,
          title: s.title,
          description: s.description,
          teamId: s.teamId,
          files: s.files || [],
          createdAt: s.createdAt,
          reviews: allFeedback
            .filter(f => f.submissionId?.toString() === s._id.toString())
            .map(f => ({ id: f._id, comment: f.comment, approved: f.approved, createdAt: f.createdAt, mentor: { id: f.mentorId._id, name: f.mentorId.name } })),
        })),
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// View kanban tasks for a specific assigned team
router.get('/teams/:teamId/kanban', async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.teamId, mentorId: req.auth.id });
    if (!team) return res.status(403).json({ error: 'Not assigned to this team' });

    const tasks = await Task.find({ teamId: req.params.teamId }).sort({ order: 1, createdAt: 1 });
    res.json(tasks.map(taskToResponse));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Post a review on a submission or milestone
router.post('/reviews', async (req, res) => {
  const { comment, approved, submissionId, milestoneId } = req.body;
  if (!comment?.trim()) return res.status(400).json({ error: 'comment is required' });
  if (!submissionId && !milestoneId) return res.status(400).json({ error: 'submissionId or milestoneId required' });

  try {
    let teamId;
    if (submissionId) {
      const sub = await Submission.findById(submissionId);
      if (!sub) return res.status(404).json({ error: 'Submission not found' });
      const team = await Team.findOne({ _id: sub.teamId, mentorId: req.auth.id });
      if (!team) return res.status(403).json({ error: 'Not assigned to this team' });
      teamId = sub.teamId;
    }
    if (milestoneId) {
      const ms = await Milestone.findById(milestoneId);
      if (!ms) return res.status(404).json({ error: 'Milestone not found' });
      const team = await Team.findOne({ _id: ms.teamId, mentorId: req.auth.id });
      if (!team) return res.status(403).json({ error: 'Not assigned to this team' });
      teamId = ms.teamId;
    }

    const approvedVal = approved !== undefined && approved !== null ? Boolean(approved) : null;

    const feedback = await Feedback.create({
      comment: comment.trim(),
      approved: approvedVal,
      mentorId: req.auth.id,
      teamId,
      submissionId: submissionId || null,
      milestoneId: milestoneId || null,
    });

    if (milestoneId && approvedVal !== null) {
      await Milestone.findByIdAndUpdate(milestoneId, { status: approvedVal ? 'APPROVED' : 'REJECTED' });
    }

    await logAction({
      action: 'FEEDBACK_POSTED',
      performedByName: req.auth.name,
      performedBy: req.auth.id,
      targetType: submissionId ? 'submission' : 'milestone',
      targetId: submissionId || milestoneId,
      details: `Approved: ${approvedVal}. Comment: "${comment.trim().slice(0, 80)}"`,
    });

    const populated = await Feedback.findById(feedback._id).populate('mentorId', 'id name');
    res.status(201).json({
      id: populated._id,
      comment: populated.comment,
      approved: populated.approved,
      createdAt: populated.createdAt,
      mentor: { id: populated.mentorId._id, name: populated.mentorId.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing review
router.put('/reviews/:id', async (req, res) => {
  const { comment, approved } = req.body;
  try {
    const existing = await Feedback.findById(req.params.id);
    if (!existing || existing.mentorId.toString() !== req.auth.id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (comment?.trim()) existing.comment = comment.trim();
    if (approved !== undefined) existing.approved = Boolean(approved);
    await existing.save();

    if (existing.milestoneId && approved !== undefined) {
      await Milestone.findByIdAndUpdate(existing.milestoneId, { status: approved ? 'APPROVED' : 'REJECTED' });
    }

    res.json({ id: existing._id, comment: existing.comment, approved: existing.approved, createdAt: existing.createdAt });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Comments ────────────────────────────────────────────────────────────────
router.get('/submissions/:id/comments', async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Not found' });
    const team = await Team.findOne({ _id: sub.teamId, mentorId: req.auth.id });
    if (!team) return res.status(403).json({ error: 'Not assigned to this team' });
    const comments = await Comment.find({ submissionId: req.params.id }).sort({ createdAt: 1 });
    res.json(comments.map(c => ({ id: c._id, body: c.body, authorName: c.authorName, authorType: c.authorType, createdAt: c.createdAt })));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/submissions/:id/comments', async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'body is required' });
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Not found' });
    const team = await Team.findOne({ _id: sub.teamId, mentorId: req.auth.id });
    if (!team) return res.status(403).json({ error: 'Not assigned to this team' });
    const comment = await Comment.create({
      submissionId: req.params.id,
      authorId: req.auth.id,
      authorType: 'mentor',
      authorName: req.auth.name,
      body: body.trim(),
    });
    res.status(201).json({ id: comment._id, body: comment.body, authorName: comment.authorName, authorType: comment.authorType, createdAt: comment.createdAt });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Announcements
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('postedBy', 'name').sort({ createdAt: -1 });
    res.json(announcements.map(announcementToResponse));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function teamToResponse(t) {
  return {
    id: t._id,
    teamCode: t.teamUniqueId,
    teamUniqueId: t.teamUniqueId,
    leaderName: t.leader.name,
    leader: t.leader,
    members: t.members,
    type: t.type,
    status: t.status,
    projectTitle: t.projectTitle,
    createdAt: t.createdAt,
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

module.exports = router;
