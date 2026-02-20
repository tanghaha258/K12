import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.exams.findMany();
  
  console.log('考试列表:');
  for (const exam of exams) {
    console.log(`  ${exam.name}: status=${exam.status}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
