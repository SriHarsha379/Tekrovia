import { PrismaClient, ProductCode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding products and prices...');

  const defs: { code: ProductCode; name: string; description: string; price: number }[] = [
    { code: ProductCode.TECH_TRAINING,     name: 'Technology Training',     description: 'All modules, guided labs, assignments and two guided projects', price: 9999 },
    { code: ProductCode.INTERVIEW_PREP,    name: 'Interview Preparation',   description: 'Interview curriculum, AI practice, three expert mocks and resume prep', price: 9999 },
    { code: ProductCode.PLACEMENT_SUPPORT, name: 'Placement Support',       description: 'Job matching, verified submissions, interview coordination', price: 9999 },
    { code: ProductCode.SOFT_SKILLS,       name: 'Corporate Soft Skills',   description: 'Communication, HR rounds, workplace skills', price: 5000 },
    { code: ProductCode.COMPLETE_PACKAGE,  name: 'Complete Package',        description: 'All services bundled', price: 29999 },
  ];

  for (const def of defs) {
    const product = await prisma.product.upsert({
      where:  { code: def.code },
      update: { name: def.name, description: def.description },
      create: { code: def.code, name: def.name, description: def.description },
    });

    const existing = await prisma.priceList.findFirst({
      where: { productId: product.id, validUntil: null },
    });

    if (!existing) {
      await prisma.priceList.create({
        data: { productId: product.id, amount: def.price, currency: 'INR' },
      });
      console.log(`  ✅ ${def.name} — ₹${def.price}`);
    } else {
      console.log(`  ⏭  ${def.name} — price already seeded`);
    }
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
