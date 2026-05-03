const AuditLog = require('../models/AuditLog');

/**
 * Logs a major system action to the AuditLog collection.
 * Silently swallows errors so a logging failure never breaks a request.
 */
async function logAction({
  action,
  performedByName,
  performedBy = null,
  performedByTeam = null,
  targetType = null,
  targetId = null,
  targetName = null,
  details = null,
}) {
  try {
    await AuditLog.create({
      action,
      performedByName,
      performedBy,
      performedByTeam,
      targetType,
      targetId,
      targetName,
      details,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write entry:', err.message);
  }
}

module.exports = logAction;
