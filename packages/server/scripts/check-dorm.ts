import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查宿舍数据...');

  const buildings = await prisma.dorm_buildings.findMany();
  console.log('宿舍楼栋:', buildings);

  const rooms = await prisma.dorm_rooms.findMany({
    include: { dorm_buildings: true },
  });
  console.log('宿舍房间:', rooms);

  const beds = await prisma.dorm_beds.findMany({
    include: {
      dorm_rooms: {
        include: { dorm_buildings: true },
      },
    },
  });
  console.log('床位:', beds);

  const students = await prisma.students.findMany({
    where: { dormBedId: { not: null } },
    include: {
      users: true,
      dorm_beds: {
        include: {
          dorm_rooms: {
            include: { dorm_buildings: true },
          },
        },
      },
    },
  });
  console.log('有宿舍的学生:', students.map(s => ({
    name: s.users.name,
    dorm: (s.dorm_beds?.dorm_rooms?.dorm_buildings?.name || '') + (s.dorm_beds?.dorm_rooms?.roomNo || '') + '-' + (s.dorm_beds?.bedNo || ''),
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
