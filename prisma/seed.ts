import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tekrovia.dev' },
    update: {},
    create: {
      email: 'admin@tekrovia.dev',
      phone: '+919999999999',
      name: 'Admin User',
      passwordHash: 'placeholder_hash',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  await prisma.candidate.upsert({
    where: { email: 'demo.student@tekrovia.dev' },
    update: {},
    create: {
      candidateCode: 'TKR-2026-000001',
      fullName: 'Demo Student',
      email: 'demo.student@tekrovia.dev',
      phone: '+919876543210',
      education: 'BACHELORS',
      graduationYear: 2024,
      experienceYears: 0,
      skills: ['JavaScript', 'React', 'Node.js'],
      targetRole: 'Full Stack Developer',
      codingPreference: 'JavaScript',
      courseInterest: 'Technology Training',
      campaignSource: 'website',
      consentGiven: true,
      user: {
        create: {
          email: 'demo.student@tekrovia.dev',
          phone: '+919876543210',
          name: 'Demo Student',
          passwordHash: 'placeholder_hash',
          role: 'STUDENT',
          isVerified: true,
        },
      },
    },
  });

  await prisma.lead.upsert({
    where: { leadCode: 'LEAD-2026-000001' },
    update: {},
    create: {
      leadCode: 'LEAD-2026-000001',
      name: 'Lead Prospect',
      email: 'lead@tekrovia.dev',
      phone: '+919988776655',
      courseInterest: 'Technology Training',
      source: 'website',
      utmSource: 'google',
      status: 'NEW',
      consentGiven: true,
    },
  });

  await prisma.healthCheck.create({
    data: {
      service: 'seed',
      status: 'ok',
    },
  });

  console.log('Seed complete:', { admin: admin.email });
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
