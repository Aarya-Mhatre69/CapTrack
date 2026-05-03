const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(422).json({ error: error.details.map(d => d.message).join('; ') });
  }
  next();
};

// ─── Auth schemas ─────────────────────────────────────────────────────────────
const teamLogin = Joi.object({
  teamCode: Joi.string().max(20).required(),
  password: Joi.string().min(4).max(100).required(),
});

const userLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(4).max(100).required(),
});

const teamRegister = Joi.object({
  leaderName: Joi.string().min(2).max(80).required(),
  leaderRollNumber: Joi.string().pattern(/^\d{7}$/).required(),
  leaderCgpi: Joi.number().min(0).max(10).optional(),
  leaderDepartment: Joi.string().max(100).optional().allow(''),
  leaderDivision: Joi.string().max(10).optional().allow(''),
  type: Joi.string().valid('Internal', 'External').optional(),
  requestedMentorId: Joi.string().hex().length(24).optional().allow('', null),
  members: Joi.array().items(
    Joi.object({
      name: Joi.string().max(80).optional().allow(''),
      rollNumber: Joi.string().max(20).optional().allow(''),
      cgpi: Joi.number().min(0).max(10).optional(),
      division: Joi.string().max(10).optional().allow(''),
    })
  ).max(4).optional(),
});

const mentorRegister = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  department: Joi.string().max(100).optional().allow(''),
  expertise: Joi.string().max(200).optional().allow(''),
});

const coordinatorRegister = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  department: Joi.string().max(100).optional().allow(''),
  institutionKey: Joi.string().required(),
});

// ─── Content schemas ──────────────────────────────────────────────────────────
const milestoneCreate = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  deadline: Joi.string().optional().allow(''),
  teamId: Joi.string().hex().length(24).optional(),
  teamIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

const announcementCreate = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  content: Joi.string().min(1).max(5000).required(),
  // coordinator uses 'NORMAL', 'HIGH', 'BROADCAST'
  priority: Joi.string().valid('NORMAL', 'HIGH', 'BROADCAST').optional(),
});

const kanbanTaskCreate = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional().allow(''),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
  assignedTo: Joi.string().max(80).optional().allow(''),
});

const kanbanTaskUpdate = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE').optional(),
  assignedTo: Joi.string().max(80).optional().allow(''),
  order: Joi.number().optional(),
});

const phaseUpdate = Joi.object({
  currentPhase: Joi.number().integer().min(0).max(10).required(),
  phases: Joi.array().optional(),
});

module.exports = {
  validate,
  schemas: {
    teamLogin,
    userLogin,
    teamRegister,
    mentorRegister,
    coordinatorRegister,
    milestoneCreate,
    announcementCreate,
    kanbanTaskCreate,
    kanbanTaskUpdate,
    phaseUpdate,
  },
};
