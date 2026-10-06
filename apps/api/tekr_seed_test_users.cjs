const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const oldAdminEmail = 'harshas379@gmail.com';

const students = [
  { name: 'Student One', email: 'student1@tekrovia.test', phone: '9000000001', password: 'TkStudent#2026A' },
  { name: 'Student Two', email: 'student2@tekrovia.test', phone: '9000000002', password: 'TkStudent#2026B' },
  { name: 'Student Three', email: 'student3@tekrovia.test', phone: '9000000003', password: 'TkStudent#2026C' },
];

async function main() {
  const emails = students.map(s => s.email);
  const phones = students.map(s => s.phone);

  const [existingUsers, existingCandidates] = await Promise.all([
    prisma.user.findMany({
      where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] },
      select: { email: true, phone: true },
    }),
    prisma.candidate.findMany({
      where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] },
      select: { email: true, phone: true },
    }),
  ]);

  if (existingUsers.length || existingCandidates.length) {
    throw new Error('A proposed student email or phone already exists. No changes made.');
  }

  const hashes = await Promise.all(students.map(s => bcrypt.hash(s.password, 12)));

  const result = await prisma.$transaction(async tx => {
    const oldAdmin = await tx.user.findUnique({
      where: { email: oldAdminEmail },
      select: { id: true, role: true },
    });

    if (oldAdmin && oldAdmin.role !== 'ADMIN' && oldAdmin.role !== 'SUPER_ADMIN') {
      throw new Error('The specified account is not an admin. No changes made.');
    }

    if (oldAdmin) {
      await tx.user.update({
        where: { id: oldAdmin.id },
        data: { isActive: false },
      });
    }

    const created = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const user = await tx.user.create({
        data: {
          name: s.name,
          email: s.email,
          phone: s.phone,
          passwordHash: hashes[i],
          role: 'STUDENT',
          isVerified: false,
          isActive: true,
          candidate: {
            create: {
              candidateCode: `TKR-TEST-${Date.now()}-${i + 1}`,
              fullName: s.name,
              email: s.email,
              phone: s.phone,
              skills: [],
              experienceYears: 0,
              careerGapMonths: 0,
              consentGiven: false,
            },
          },
        },
        select: {
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          candidate: { select: { candidateCode: true } },
        },
      });
      created.push(user);
    }

    return { oldAdminDeactivated: Boolean(oldAdmin), created };
  });

  console.log(JSON.stringify(result, null, 2));
  console.log('Completed successfully.');
}

main()
  .catch(error => {
    console.error('FAILED:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
