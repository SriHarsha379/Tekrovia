const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@tekrovia.test';
  const phone = '9000000099';
  const password = 'TekAdmin#2026A';

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
    select: { id: true, email: true, phone: true, role: true },
  });

  if (existing) {
    throw new Error(
      'Email or phone already exists. No changes made. Existing account: ' +
      JSON.stringify(existing)
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name: 'TekRovia Admin',
      email,
      phone,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log('Admin account created successfully:');
  console.log(JSON.stringify(admin, null, 2));
}

main()
  .catch((error) => {
    console.error('FAILED:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
