const router = require('express').Router();
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { authenticate, requireRole, requireTeam } = require('../middleware/auth');
const Team = require('../models/Team');
const Milestone = require('../models/Milestone');
const Submission = require('../models/Submission');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// ─── PDF Interaction Sheet (student — their own team) ────────────────────────
router.get('/pdf/me', authenticate, requireTeam, async (req, res, next) => { req.params.teamId = req.auth.id; next(); });
router.get('/pdf/:teamId', authenticate, requireTeam, async (req, res) => {
  try {
    const team = await Team.findById(req.auth.id).populate('mentorId', 'name department');
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const submissions = await Submission.find({ teamId: team._id })
      .populate('milestoneId', 'title')
      .sort({ createdAt: 1 });

    const subIds = submissions.map(s => s._id);
    const feedbacks = await Feedback.find({ submissionId: { $in: subIds } })
      .populate('mentorId', 'name')
      .sort({ createdAt: -1 });

    const fbBySub = {};
    feedbacks.forEach(f => {
      const key = f.submissionId.toString();
      if (!fbBySub[key]) fbBySub[key] = [];
      fbBySub[key].push(f);
    });

    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'Capstone Interaction Sheet' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="interaction_${team.teamUniqueId}.pdf"`);
    doc.pipe(res);

    const PRIMARY = '#4f46e5';
    const SLATE = '#475569';
    const LIGHT = '#f8fafc';
    const BORDER = '#e2e8f0';

    // Header banner
    doc.rect(0, 0, 595, 90).fill(PRIMARY);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(20)
      .text('Fr. CRIT — Capstone Project Monitoring', 50, 25, { align: 'left' });
    doc.font('Helvetica').fontSize(11).fillColor('#c7d2fe')
      .text('Student Interaction Sheet  •  AY 2025–2026', 50, 52);

    doc.moveDown(2.5);

    // Team info box
    const boxY = 105;
    doc.rect(50, boxY, 495, 115).fillAndStroke('#eef2ff', BORDER);
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(12)
      .text('Team Information', 65, boxY + 12);
    doc.strokeColor(BORDER).moveTo(65, boxY + 28).lineTo(530, boxY + 28).stroke();

    const info = [
      ['Team ID', team.teamUniqueId],
      ['Leader', team.leader.name + (team.leader.rollNumber ? `  (${team.leader.rollNumber})` : '')],
      ['Project Title', team.projectTitle || 'Not submitted'],
      ['Assigned Mentor', team.mentorId?.name || 'Not assigned'],
      ['Team Type', team.type],
    ];
    let iy = boxY + 36;
    info.forEach(([label, val]) => {
      doc.fillColor(SLATE).font('Helvetica').fontSize(9).text(label + ':', 65, iy);
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9).text(val || '—', 165, iy);
      iy += 15;
    });

    // Members table
    doc.moveDown(0.5);
    let y = boxY + 130;
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(12).text('Team Members', 50, y);
    y += 18;

    const mCols = [50, 210, 330, 400, 470];
    const mHeaders = ['Name', 'Roll Number', 'CGPI', 'Division', 'Role'];
    doc.rect(50, y, 495, 20).fill('#eef2ff');
    mHeaders.forEach((h, i) => {
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(9).text(h, mCols[i] + 4, y + 5);
    });
    y += 20;

    const allMembers = [
      { name: team.leader.name, rollNumber: team.leader.rollNumber, cgpi: team.leader.cgpi, division: team.leader.division, role: 'Leader' },
      ...team.members.map(m => ({ ...m, role: 'Member' })),
    ];

    allMembers.forEach((m, idx) => {
      if (idx % 2 === 0) doc.rect(50, y, 495, 18).fill(LIGHT);
      doc.rect(50, y, 495, 18).stroke(BORDER);
      const row = [m.name, m.rollNumber || '—', m.cgpi || '—', m.division || '—', m.role];
      row.forEach((val, i) => {
        doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(String(val), mCols[i] + 4, y + 4, { width: 120, lineBreak: false });
      });
      y += 18;
    });

    y += 16;

    // Submission history
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(12).text('Submission History', 50, y);
    y += 18;

    if (submissions.length === 0) {
      doc.rect(50, y, 495, 36).fill(LIGHT).stroke(BORDER);
      doc.fillColor(SLATE).font('Helvetica').fontSize(10)
        .text('No submissions yet.', 50, y + 11, { width: 495, align: 'center' });
      y += 36;
    } else {
      const sCols = [50, 160, 250, 360, 460];
      const sHeaders = ['Milestone', 'Date', 'Files', 'Mentor Feedback', 'Status'];
      doc.rect(50, y, 495, 20).fill('#eef2ff');
      sHeaders.forEach((h, i) => {
        doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(9).text(h, sCols[i] + 4, y + 5);
      });
      y += 20;

      for (const s of submissions) {
        const fb = fbBySub[s._id.toString()]?.[0];
        const status = fb ? (fb.approved === true ? 'Approved' : fb.approved === false ? 'Rejected' : 'Reviewed') : 'Pending';
        const feedbackText = fb ? fb.comment.slice(0, 55) + (fb.comment.length > 55 ? '…' : '') : 'Pending review';
        const dateStr = new Date(s.createdAt).toLocaleDateString('en-IN');
        const filesStr = s.files?.map(f => f.filename).join(', ').slice(0, 40) || '—';
        const rowH = 22;

        if (y + rowH > 760) { doc.addPage(); y = 50; }

        doc.rect(50, y, 495, rowH).fill(LIGHT).stroke(BORDER);
        const statusColor = status === 'Approved' ? '#059669' : status === 'Rejected' ? '#dc2626' : '#d97706';
        const row = [s.milestoneId?.title || '—', dateStr, filesStr, feedbackText];
        row.forEach((val, i) => {
          doc.fillColor('#334155').font('Helvetica').fontSize(8).text(val, sCols[i] + 4, y + 5, { width: 100, lineBreak: false });
        });
        doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(8).text(status, sCols[4] + 4, y + 5);
        y += rowH;
      }
    }

    y += 20;

    // Signatures
    if (y + 80 > 750) { doc.addPage(); y = 50; }
    doc.rect(50, y, 495, 70).fill(LIGHT).stroke(BORDER);
    doc.fillColor(SLATE).font('Helvetica-Bold').fontSize(9)
      .text('Mentor Signature', 80, y + 12)
      .text('Student Signature', 250, y + 12)
      .text('Coordinator Signature', 420, y + 12);
    doc.fillColor(BORDER)
      .moveTo(65, y + 52).lineTo(195, y + 52).stroke()
      .moveTo(235, y + 52).lineTo(365, y + 52).stroke()
      .moveTo(405, y + 52).lineTo(530, y + 52).stroke();

    // Footer
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
      .text(`Generated: ${new Date().toLocaleString('en-IN')}  •  CapTrack © 2026`, 50, 810, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Server error' });
  }
});

// ─── Excel Report (coordinator — all teams) ───────────────────────────────────
router.get('/excel', authenticate, requireRole('COORDINATOR'), async (req, res) => {
  try {
    const [teams, milestones, submissions] = await Promise.all([
      Team.find().populate('mentorId', 'name').sort({ createdAt: 1 }),
      Milestone.find().select('teamId status'),
      Submission.find().select('teamId'),
    ]);

    const msMap = {};
    milestones.forEach(m => {
      const k = m.teamId.toString();
      if (!msMap[k]) msMap[k] = { total: 0, approved: 0 };
      msMap[k].total++;
      if (m.status === 'APPROVED') msMap[k].approved++;
    });

    const subMap = {};
    submissions.forEach(s => {
      const k = s.teamId.toString();
      subMap[k] = (subMap[k] || 0) + 1;
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'CapTrack';
    wb.created = new Date();

    // ── Sheet 1: Teams Overview ──
    const ws = wb.addWorksheet('Teams Overview', { views: [{ state: 'frozen', ySplit: 1 }] });

    ws.columns = [
      { header: 'Team ID',         key: 'teamId',       width: 14 },
      { header: 'Leader Name',     key: 'leader',       width: 22 },
      { header: 'Roll Number',     key: 'roll',         width: 14 },
      { header: 'Project Title',   key: 'project',      width: 35 },
      { header: 'Team Type',       key: 'type',         width: 12 },
      { header: 'Mentor',          key: 'mentor',       width: 22 },
      { header: 'Status',          key: 'status',       width: 16 },
      { header: 'Milestones',      key: 'milestones',   width: 14 },
      { header: 'Approved',        key: 'approved',     width: 12 },
      { header: 'Submissions',     key: 'submissions',  width: 14 },
      { header: 'Registered',      key: 'registered',   width: 18 },
    ];

    // Header row style
    ws.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
    ws.getRow(1).height = 24;

    const statusColors = {
      ACTIVE: 'FF059669', PENDING: 'FFD97706',
      MENTOR_APPROVED: 'FF3B82F6', REJECTED: 'FFDC2626',
    };

    teams.forEach((t, idx) => {
      const tid = t._id.toString();
      const ms = msMap[tid] || { total: 0, approved: 0 };
      const row = ws.addRow({
        teamId:      t.teamUniqueId,
        leader:      t.leader.name,
        roll:        t.leader.rollNumber || '—',
        project:     t.projectTitle || 'Not submitted',
        type:        t.type,
        mentor:      t.mentorId?.name || 'Not assigned',
        status:      t.status,
        milestones:  ms.total,
        approved:    ms.approved,
        submissions: subMap[tid] || 0,
        registered:  new Date(t.createdAt).toLocaleDateString('en-IN'),
      });

      row.height = 20;
      const fillColor = idx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.alignment = { vertical: 'middle' };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
      });

      const statusCell = row.getCell('status');
      const sc = statusColors[t.status] || 'FF64748B';
      statusCell.font = { bold: true, color: { argb: sc } };
    });

    // ── Sheet 2: Milestones Detail ──
    const ms2 = wb.addWorksheet('Milestones', { views: [{ state: 'frozen', ySplit: 1 }] });
    const allMs = await Milestone.find().populate('teamId', 'teamUniqueId leader').sort({ deadline: 1 });

    ms2.columns = [
      { header: 'Team ID',    key: 'teamId',   width: 14 },
      { header: 'Leader',     key: 'leader',   width: 22 },
      { header: 'Title',      key: 'title',    width: 35 },
      { header: 'Deadline',   key: 'deadline', width: 18 },
      { header: 'Status',     key: 'status',   width: 16 },
    ];
    ms2.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ms2.getRow(1).height = 24;

    allMs.forEach((m, idx) => {
      const row = ms2.addRow({
        teamId:   m.teamId?.teamUniqueId || '—',
        leader:   m.teamId?.leader?.name || '—',
        title:    m.title,
        deadline: new Date(m.deadline).toLocaleDateString('en-IN'),
        status:   m.status,
      });
      row.height = 20;
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle' };
      });
      const sc = { APPROVED: 'FF059669', REJECTED: 'FFDC2626', SUBMITTED: 'FF3B82F6', PENDING: 'FFD97706' }[m.status] || 'FF64748B';
      row.getCell('status').font = { bold: true, color: { argb: sc } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="captrack_report_${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Server error' });
  }
});

// ─── LaTeX report (kept for student self-download) ────────────────────────────
router.get('/latex/:teamId', authenticate, requireTeam, async (req, res) => {
  try {
    const team = await Team.findById(req.auth.id).populate('mentorId', 'name');
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const submissions = await Submission.find({ teamId: team._id })
      .populate('milestoneId', 'title')
      .sort({ createdAt: 1 });

    const subIds = submissions.map(s => s._id);
    const feedbacks = await Feedback.find({ submissionId: { $in: subIds } })
      .populate('mentorId', 'name')
      .sort({ createdAt: -1 });

    const fbBySub = {};
    feedbacks.forEach(f => {
      const key = f.submissionId.toString();
      if (!fbBySub[key]) fbBySub[key] = [];
      fbBySub[key].push(f);
    });

    const esc = s => (s || '').toString()
      .replace(/\\/g, '\\textbackslash{}').replace(/&/g, '\\&').replace(/%/g, '\\%')
      .replace(/\$/g, '\\$').replace(/#/g, '\\#').replace(/_/g, '\\_')
      .replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}').replace(/</g, '\\textless{}').replace(/>/g, '\\textgreater{}');

    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const dept = team.leader.department || 'Computer Engineering';

    const memberRows = [
      `${esc(team.leader.name)} & ${esc(team.leader.rollNumber)} & ${team.leader.cgpi || '--'} & ${esc(team.leader.division || '--')} & ${esc(dept)} & Leader \\\\\\hline`,
      ...team.members.map(m =>
        `${esc(m.name)} & ${esc(m.rollNumber)} & ${m.cgpi || '--'} & ${esc(m.division || '--')} & ${esc(dept)} & Member \\\\\\hline`
      ),
    ].join('\n');

    const submissionRows = submissions.length
      ? submissions.map(s => {
          const fb = fbBySub[s._id.toString()]?.[0];
          const feedback = fb ? esc(fb.comment) : 'Pending';
          const status = fb ? (fb.approved === true ? 'Approved' : fb.approved === false ? 'Rejected' : 'Reviewed') : 'Pending';
          const files = s.files?.map(f => esc(f.filename)).join(', ') || '--';
          return `${esc(s.milestoneId?.title || '--')} & ${new Date(s.createdAt).toLocaleDateString('en-IN')} & ${files} & ${feedback} & ${status} \\\\\\hline`;
        }).join('\n')
      : '\\multicolumn{5}{|c|}{No submissions yet} \\\\\\hline';

    const latex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{booktabs,longtable,array,fancyhdr,xcolor,hyperref}
\\pagestyle{fancy}\\fancyhf{}
\\rhead{Capstone Project Monitoring System}
\\lhead{Department of ${esc(dept)}}
\\cfoot{\\thepage}
\\begin{document}
\\begin{center}
  {\\Large\\bfseries Department of ${esc(dept)}}\\\\[0.5em]
  {\\large\\bfseries Capstone Project Report}\\\\[0.3em]
  {\\normalsize Academic Year 2025--2026}
\\end{center}
\\vspace{1em}\\hrule\\vspace{1em}
\\section*{Project Information}
\\begin{tabular}{ll}
\\textbf{Team ID:} & ${esc(team.teamUniqueId)} \\\\[0.3em]
\\textbf{Project Title:} & ${esc(team.projectTitle || 'Not submitted yet')} \\\\[0.3em]
\\textbf{Mentor:} & ${esc(team.mentorId?.name || 'Not assigned')} \\\\[0.3em]
\\textbf{Date:} & ${date} \\\\
\\end{tabular}
\\section*{Team Members}
\\begin{longtable}{|p{3cm}|p{2cm}|p{1.2cm}|p{1.2cm}|p{3.5cm}|p{1.8cm}|}
\\hline\\textbf{Name} & \\textbf{Roll No.} & \\textbf{CGPI} & \\textbf{Div.} & \\textbf{Branch} & \\textbf{Role} \\\\\\hline
${memberRows}
\\end{longtable}
\\section*{Submission History}
\\begin{longtable}{|p{3cm}|p{2cm}|p{3cm}|p{4cm}|p{1.5cm}|}
\\hline\\textbf{Milestone} & \\textbf{Date} & \\textbf{File(s)} & \\textbf{Feedback} & \\textbf{Status} \\\\\\hline
${submissionRows}
\\end{longtable}
\\end{document}`;

    res.setHeader('Content-Type', 'application/x-tex');
    res.setHeader('Content-Disposition', `attachment; filename="report_${team.teamUniqueId}.tex"`);
    res.send(latex);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
