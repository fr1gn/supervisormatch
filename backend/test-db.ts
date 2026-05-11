import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connection...');
  try {
    const userCount = await prisma.user.count();
    const supervisorCount = await prisma.supervisor.count();
    console.log(`✅ Connection successful!`);
    console.log(`📊 Current Users in DB: ${userCount}`);
    console.log(`📊 Current Supervisors in DB: ${supervisorCount}`);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
