require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Team = require('./src/models/Team');
const Milestone = require('./src/models/Milestone');
const Submission = require('./src/models/Submission');
const Feedback = require('./src/models/Feedback');
const Announcement = require('./src/models/Announcement');

const h = p => bcrypt.hash(p, 10);
const past = d => new Date(Date.now() - d * 86400000);
const future = d => new Date(Date.now() + d * 86400000);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany(),
    Team.deleteMany(),
    Milestone.deleteMany(),
    Submission.deleteMany(),
    Feedback.deleteMany(),
    Announcement.deleteMany(),
  ]);

  // ─── Users ────────────────────────────────────────────────────────────────
  const coordinator = await User.create({
    name: 'Dr. Smitha Dange',
    email: 'smitha.dange@capstone.edu',
    password: await h('password123'),
    role: 'coordinator',
  });

  const mentor1 = await User.create({
    name: 'Mrs. Chetana',
    email: 'chetana@capstone.edu',
    password: await h('password123'),
    role: 'mentor',
    department: 'Computer Engineering',
    expertise: 'IoT, Embedded Systems',
  });

  const mentor2 = await User.create({
    name: 'Mrs. Nupur',
    email: 'nupur@capstone.edu',
    password: await h('password123'),
    role: 'mentor',
    department: 'Computer Engineering',
    expertise: 'AI, Data Science',
  });

  // ─── Teams ────────────────────────────────────────────────────────────────
  const team1 = await Team.create({
    teamUniqueId: '2026001',
    teamPassword: await h('Pass1234'),
    rollNumber: '1023214',
    leader: { name: 'Allen', rollNumber: '1023214', cgpi: 8.5, department: 'Computer Engineering', division: 'B' },
    members: [
      { name: 'Aarya', rollNumber: '1023221', cgpi: 8.1, division: 'B' },
      { name: 'Melissa', rollNumber: '1023235', cgpi: 7.9, division: 'B' },
    ],
    remark: 'Internal',
    mentorId: mentor1._id,
  });

  const team2 = await Team.create({
    teamUniqueId: '2026002',
    teamPassword: await h('Pass5678'),
    rollNumber: '1023271',
    leader: { name: 'Riya', rollNumber: '1023271', cgpi: 9.0, department: 'Computer Engineering', division: 'B' },
    members: [
      { name: 'Pratiksha', rollNumber: '1023282', cgpi: 8.7, division: 'B' },
      { name: 'Sandra', rollNumber: '1023295', cgpi: 7.5, division: 'B' },
    ],
    remark: 'Internal',
    mentorId: mentor2._id,
  });

  // ─── Milestones ───────────────────────────────────────────────────────────
  const ms1a = await Milestone.create({
    title: 'Requirements & System Design',
    deadline: past(45),
    teamId: team1._id,
    setBy: coordinator._id,
    status: 'APPROVED',
  });

  const ms1b = await Milestone.create({
    title: 'Prototype Development',
    deadline: future(14),
    teamId: team1._id,
    setBy: coordinator._id,
    status: 'PENDING',
  });

  const ms2a = await Milestone.create({
    title: 'Literature Review & Planning',
    deadline: past(30),
    teamId: team2._id,
    setBy: coordinator._id,
    status: 'APPROVED',
  });

  const ms2b = await Milestone.create({
    title: 'Core Algorithm Implementation',
    deadline: future(21),
    teamId: team2._id,
    setBy: coordinator._id,
    status: 'PENDING',
  });

  // ─── Submissions ──────────────────────────────────────────────────────────
  const sub1 = await Submission.create({
    teamId: team1._id,
    milestoneId: ms1a._id,
    title: 'System Design Document',
    description: 'Comprehensive design document for the capstone project including architecture diagrams, data flow, and component selection.',
  });

  const sub2 = await Submission.create({
    teamId: team2._id,
    milestoneId: ms2a._id,
    title: 'Literature Review Report',
    description: 'Summary of 20+ research papers highlighting key algorithms, datasets, and evaluation metrics used in the field.',
  });

  // ─── Feedback ─────────────────────────────────────────────────────────────
  await Feedback.create({
    mentorId: mentor1._id,
    teamId: team1._id,
    submissionId: sub1._id,
    milestoneId: ms1a._id,
    comment: 'Excellent design document. The architecture is well thought out and the data flow is clear. Approved to proceed to prototype phase.',
    approved: true,
  });

  await Feedback.create({
    mentorId: mentor2._id,
    teamId: team2._id,
    submissionId: sub2._id,
    milestoneId: ms2a._id,
    comment: 'Thorough literature review with good coverage of state-of-the-art approaches. Please add more detail on evaluation metrics. Approved.',
    approved: true,
  });

  // ─── Announcements ────────────────────────────────────────────────────────
  await Announcement.create({
    title: 'Final Presentation Schedule Released',
    content: 'Final project presentations will be held from May 10–14, 2026. Each team will have 20 minutes to present followed by a 10-minute Q&A. Ensure your projects are deployment-ready by the end of April.',
    postedBy: coordinator._id,
  });

  await Announcement.create({
    title: 'Reminder: Keep Milestone Submissions Up to Date',
    content: 'All teams must ensure their milestone submissions are current. Mentors have been asked to complete reviews within 5 business days. Contact your mentor if a review has been pending for more than a week.',
    postedBy: coordinator._id,
  });

  console.log('\n✅ Seed completed!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  COORDINATOR');
  console.log('  Name:     Dr. Smitha Dange');
  console.log('  Email:    smitha.dange@capstone.edu');
  console.log('  Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  MENTORS');
  console.log('  Mrs. Chetana  ·  chetana@capstone.edu  /  password123');
  console.log('  Mrs. Nupur    ·  nupur@capstone.edu    /  password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STUDENT TEAMS');
  console.log('  Team ID: 2026001   Password: Pass1234');
  console.log('    Leader: Allen (CGPI 8.5, Roll: 1023214, Div: B, Computer Engineering)');
  console.log('    Members: Aarya (8.1, Roll: 1023221, Div: B), Melissa (7.9, Roll: 1023235, Div: B)');
  console.log('    Remark: Internal  |  Mentor: Mrs. Chetana');
  console.log('  Team ID: 2026002   Password: Pass5678');
  console.log('    Leader: Riya (CGPI 9.0, Roll: 1023271, Div: B, Computer Engineering)');
  console.log('    Members: Pratiksha (8.7, Roll: 1023282, Div: B), Sandra (7.5, Roll: 1023295, Div: B)');
  console.log('    Remark: Internal  |  Mentor: Mrs. Nupur');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => mongoose.disconnect());
