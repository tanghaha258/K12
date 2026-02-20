import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('创建高一分段规则...');

  // 获取高一的年级ID
  const grade = await prisma.grades.findFirst({
    where: { name: '高一' },
  });

  if (!grade) {
    console.log('未找到高一，请先创建年级');
    return;
  }

  console.log(`找到年级: ${grade.name} (${grade.id})`);

  // 获取高一的科目
  const subjects = await prisma.subjects.findMany({
    where: {
      subject_grades: {
        some: {
          gradeId: grade.id,
        },
      },
    },
  });

  console.log('高一科目:', subjects.map(s => `${s.name}(${s.code}, ${s.maxScore}分)`));

  // 语数英 150分制规则
  const mainSubjects = ['语文', '数学', '英语'];
  const mainSubjectIds = subjects
    .filter(s => mainSubjects.includes(s.name))
    .map(s => s.id);

  console.log('\n语数英科目ID:', mainSubjectIds);

  // 为每个语数英科目创建150分制规则
  for (const subjectId of mainSubjectIds) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) continue;

    const existing = await prisma.score_segments.findFirst({
      where: {
        gradeId: grade.id,
        subjectId: subjectId,
      },
    });

    if (!existing) {
      await prisma.score_segments.create({
        data: {
          id: uuidv4(),
          name: `${subject.name}分段规则(150分制)`,
          gradeId: grade.id,
          subjectId: subjectId,
          excellentMin: 120,  // 优秀 120分
          goodMin: 96,        // 良好 96分
          passMin: 72,        // 及格 72分
          failMax: 71,        // 低分 71分及以下
          isDefault: false,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      console.log(`创建 ${subject.name} 分段规则: 优秀120/良好96/及格72/低分71`);
    } else {
      // 更新现有规则
      await prisma.score_segments.update({
        where: { id: existing.id },
        data: {
          excellentMin: 120,
          goodMin: 96,
          passMin: 72,
          failMax: 71,
          updatedAt: new Date(),
        },
      });
      console.log(`更新 ${subject.name} 分段规则: 优秀120/良好96/及格72/低分71`);
    }
  }

  // 其他科目 100分制规则
  const otherSubjects = subjects.filter(s => !mainSubjects.includes(s.name));
  
  for (const subject of otherSubjects) {
    const existing = await prisma.score_segments.findFirst({
      where: {
        gradeId: grade.id,
        subjectId: subject.id,
      },
    });

    if (!existing) {
      await prisma.score_segments.create({
        data: {
          id: uuidv4(),
          name: `${subject.name}分段规则(100分制)`,
          gradeId: grade.id,
          subjectId: subject.id,
          excellentMin: 80,   // 优秀 80分
          goodMin: 70,        // 良好 70分
          passMin: 60,        // 及格 60分
          failMax: 59,        // 低分 59分及以下
          isDefault: false,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      console.log(`创建 ${subject.name} 分段规则: 优秀80/良好70/及格60/低分59`);
    } else {
      // 更新现有规则
      await prisma.score_segments.update({
        where: { id: existing.id },
        data: {
          excellentMin: 80,
          goodMin: 70,
          passMin: 60,
          failMax: 59,
          updatedAt: new Date(),
        },
      });
      console.log(`更新 ${subject.name} 分段规则: 优秀80/良好70/及格60/低分59`);
    }
  }

  // 创建高一默认规则（100分制，用于总分统计）
  const defaultSegment = await prisma.score_segments.findFirst({
    where: {
      gradeId: grade.id,
      subjectId: null,
    },
  });

  if (!defaultSegment) {
    await prisma.score_segments.create({
      data: {
        id: uuidv4(),
        name: '高一默认分段规则(总分)',
        gradeId: grade.id,
        subjectId: null,  // null 表示适用于所有科目或总分
        excellentMin: 80,
        goodMin: 70,
        passMin: 60,
        failMax: 59,
        isDefault: true,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log('\n创建高一默认分段规则(总分): 优秀80/良好70/及格60/低分59');
  } else {
    await prisma.score_segments.update({
      where: { id: defaultSegment.id },
      data: {
        excellentMin: 80,
        goodMin: 70,
        passMin: 60,
        failMax: 59,
        isDefault: true,
        updatedAt: new Date(),
      },
    });
    console.log('\n更新高一默认分段规则(总分): 优秀80/良好70/及格60/低分59');
  }

  console.log('\n=== 分段规则创建完成 ===');
  
  // 显示所有规则
  const allSegments = await prisma.score_segments.findMany({
    where: { gradeId: grade.id },
    include: { subjects: true },
  });
  
  console.log('\n当前高一所有分段规则:');
  for (const seg of allSegments) {
    console.log(`  ${seg.name}: 优秀${seg.excellentMin}/良好${seg.goodMin}/及格${seg.passMin}/低分${seg.failMax} ${seg.isDefault ? '(默认)' : ''}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
