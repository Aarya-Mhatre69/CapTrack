const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { authenticate, requireTeam } = require('../middleware/auth');
const Team = require('../models/Team');
const Milestone = require('../models/Milestone');
const Submission = require('../models/Submission');
const Feedback = require('../models/Feedback');
const Announcement = require('../models/Announcement');
const Task = require('../models/Task');
const logAction = require('../utils/auditLog');
const { validate, schemas } = require('../middleware/validate');
const Comment = require('../models/Comment');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed'), false);
};

const upload = multer({ storage, fileFilter: pdfFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate, requireTeam);

// Team info (always available regardless of status)
router.get('/me', async (req, res) => {
  try {
    const team = await Team.findById(req.auth.id)
      .populate('mentorId', 'id name email department')
      .populate('requestedMentorId', 'id name email department');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(teamToResponse(team));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Project
router.get('/project', async (req, res) => {
  try {
    const team = await Team.findById(req.auth.id);
    if (!team || !team.projectTitle) return res.json(null);
    res.json({ id: team._id, title: team.projectTitle, description: team.projectDescription, teamId: team._id, updatedAt: team.updatedAt });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/project', async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  try {
    const team = await Team.findById(req.auth.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.projectTitle) return res.status(409).json({ error: 'Project already exists. Use PUT to update.' });
    team.projectTitle = title.trim();
    team.projectDescription = description?.trim() || '';
    await team.save();
    res.status(201).json({ id: team._id, title: team.projectTitle, description: team.projectDescription, teamId: team._id, updatedAt: team.updatedAt });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/project', async (req, res) => {
  const { title, description } = req.body;
  try {
    const team = await Team.findById(req.auth.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (title?.trim()) team.projectTitle = title.trim();
    if (description !== undefined) team.projectDescription = description?.trim() || '';
    await team.save();
    res.json({ id: team._id, title: team.projectTitle, description: team.projectDescription, teamId: team._id, updatedAt: team.updatedAt });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Milestones
router.get('/milestones', async (req, res) => {
  try {
    const milestones = await Milestone.find({ teamId: req.auth.id }).sort({ deadline: 1 });
    const milestoneIds = milestones.map(m => m._id);
    const feedbacks = await Feedback.find({ milestoneId: { $in: milestoneIds } })
      .populate('mentorId', 'id name')
      .sort({ createdAt: -1 });

    const fbByMs = {};
    feedbacks.forEach(f => {
      const key = f.milestoneId.toString();
      if (!fbByMs[key]) fbByMs[key] = [];
      fbByMs[key].push(feedbackToReview(f));
    });

    res.json(milestones.map(m => ({
      id: m._id, title: m.title, deadline: m.deadline, status: m.status, teamId: m.teamId, createdAt: m.createdAt,
      reviews: fbByMs[m._id.toString()] || [],
    })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Submissions
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find({ teamId: req.auth.id })
      .populate('milestoneId', 'title')
      .sort({ createdAt: -1 });
    const subIds = submissions.map(s => s._id);
    const feedbacks = await Feedback.find({ submissionId: { $in: subIds } })
      .populate('mentorId', 'id name')
      .sort({ createdAt: -1 });

    const fbBySub = {};
    feedbacks.forEach(f => {
      const key = f.submissionId.toString();
      if (!fbBySub[key]) fbBySub[key] = [];
      fbBySub[key].push(feedbackToReview(f));
    });

    res.json(submissions.map(s => ({
      id: s._id, title: s.title, description: s.description, teamId: s.teamId,
      milestoneId: s.milestoneId?._id || null, milestoneName: s.milestoneId?.title || null,
      files: s.files || [], version: s.version || 1, createdAt: s.createdAt,
      reviews: fbBySub[s._id.toString()] || [],
    })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/submissions', async (req, res, next) => {
  // Block submission uploads for non-active teams
  const team = await Team.findById(req.auth.id).select('status');
  if (team?.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Your team must be activated by the coordinator before submitting.' });
  }
  next();
}, (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  const { title, description, milestoneId } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!milestoneId) return res.status(400).json({ error: 'Please select a milestone for this submission' });
  try {
    const milestone = await Milestone.findOne({ _id: milestoneId, teamId: req.auth.id });
    if (!milestone) return res.status(404).json({ error: 'Milestone not found for your team' });

    const files = (req.files || []).map(f => ({
      filename: f.originalname, storedName: f.filename,
      path: `/uploads/${f.filename}`, mimetype: f.mimetype, size: f.size,
    }));

    const prevCount = await Submission.countDocuments({ teamId: req.auth.id, milestoneId });
    const submission = await Submission.create({
      teamId: req.auth.id, milestoneId, title: title.trim(),
      description: description?.trim() || '', files,
      version: prevCount + 1,
    });

    await logAction({
      action: 'SUBMISSION_UPLOADED',
      performedByName: req.auth.teamCode,
      performedByTeam: req.auth.id,
      targetType: 'submission',
      targetId: submission._id,
      targetName: title.trim(),
      details: `Milestone: ${milestone.title}. Files: ${files.length}`,
    });

    res.status(201).json({
      id: submission._id, title: submission.title, description: submission.description,
      teamId: submission.teamId, milestoneId: submission.milestoneId, milestoneName: milestone.title,
      files: submission.files, version: submission.version, createdAt: submission.createdAt, reviews: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
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

// ─── Kanban ───────────────────────────────────────────────────────────────────
router.get('/kanban', async (req, res) => {
  try {
    const tasks = await Task.find({ teamId: req.auth.id }).sort({ order: 1, createdAt: 1 });
    res.json(tasks.map(taskToResponse));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/kanban', validate(schemas.kanbanTaskCreate), async (req, res) => {
  const { title, description, priority, assignedTo } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  try {
    const team = await Team.findById(req.auth.id).select('leader teamUniqueId');
    const task = await Task.create({
      teamId: req.auth.id,
      title: title.trim(),
      description: description?.trim() || '',
      priority: ['LOW', 'MEDIUM', 'HIGH'].includes(priority) ? priority : 'MEDIUM',
      assignedTo: assignedTo?.trim() || '',
      createdByName: team?.leader?.name || team?.teamUniqueId || 'Team',
      status: 'TODO',
    });
    res.status(201).json(taskToResponse(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/kanban/:id', validate(schemas.kanbanTaskUpdate), async (req, res) => {
  const { title, description, status, priority, assignedTo, order } = req.body;
  try {
    const task = await Task.findOne({ _id: req.params.id, teamId: req.auth.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (title?.trim()) task.title = title.trim();
    if (description !== undefined) task.description = description?.trim() || '';
    if (status && ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].includes(status)) task.status = status;
    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo?.trim() || '';
    if (order !== undefined) task.order = order;
    await task.save();

    res.json(taskToResponse(task));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/kanban/:id', async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, teamId: req.auth.id });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Comments ────────────────────────────────────────────────────────────────
router.get('/submissions/:id/comments', async (req, res) => {
  try {
    const sub = await Submission.findOne({ _id: req.params.id, teamId: req.auth.id });
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    const comments = await Comment.find({ submissionId: req.params.id }).sort({ createdAt: 1 });
    res.json(comments.map(commentToResponse));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/submissions/:id/comments', async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'body is required' });
  try {
    const sub = await Submission.findOne({ _id: req.params.id, teamId: req.auth.id });
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    const team = await Team.findById(req.auth.id).select('leader teamUniqueId');
    const comment = await Comment.create({
      submissionId: req.params.id,
      authorId: req.auth.id,
      authorType: 'team',
      authorName: team?.leader?.name || team?.teamUniqueId || 'Team',
      body: body.trim(),
    });
    res.status(201).json(commentToResponse(comment));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function teamToResponse(team) {
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
    mentor: team.mentorId ? { id: team.mentorId._id, name: team.mentorId.name, email: team.mentorId.email, department: team.mentorId.department } : null,
    requestedMentor: team.requestedMentorId ? { id: team.requestedMentorId._id, name: team.requestedMentorId.name, email: team.requestedMentorId.email, department: team.requestedMentorId.department } : null,
    mentorId: team.mentorId?._id || null,
    status: team.status,
    type: team.type,
    rejectionReason: team.rejectionReason,
    createdAt: team.createdAt,
  };
}

function feedbackToReview(f) {
  return { id: f._id, comment: f.comment, approved: f.approved, createdAt: f.createdAt, mentor: f.mentorId ? { id: f.mentorId._id, name: f.mentorId.name } : null };
}

function announcementToResponse(a) {
  return { id: a._id, title: a.title, content: a.content, priority: a.priority, createdAt: a.createdAt, coordinator: a.postedBy ? { name: a.postedBy.name } : null };
}

function commentToResponse(c) {
  return { id: c._id, body: c.body, authorName: c.authorName, authorType: c.authorType, createdAt: c.createdAt };
}

function taskToResponse(t) {
  return { id: t._id, title: t.title, description: t.description, status: t.status, priority: t.priority, assignedTo: t.assignedTo, createdByName: t.createdByName, order: t.order, createdAt: t.createdAt, updatedAt: t.updatedAt };
}

module.exports = router;
