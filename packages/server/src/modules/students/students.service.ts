import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto/student.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    const existingStudent = await this.prisma.students.findUnique({
      where: { studentNo: createStudentDto.studentNo },
    });

    if (existingStudent) {
      throw new ConflictException('学号已存�?);
    }

    const grade = await this.prisma.grades.findUnique({
      where: { id: createStudentDto.gradeId },
    });
    if (!grade) {
      throw new NotFoundException('年级不存�?);
    }

    const classEntity = await this.prisma.classes.findUnique({
      where: { id: createStudentDto.classId },
    });
    if (!classEntity) {
      throw new NotFoundException('班级不存�?);
    }

    // 处理宿舍关联
    let dormRoomId: string | undefined = createStudentDto.dormRoomId;
    let dormBedId: string | undefined = createStudentDto.dormBedId;

    // 如果提供了宿舍楼栋和房间号，查找对应的宿舍ID
    if (createStudentDto.dormBuilding && createStudentDto.dormRoom) {
      const building = await this.prisma.dormBuilding.findUnique({
        where: { name: createStudentDto.dormBuilding },
      });
      if (building) {
        const room = await this.prisma.dormRoom.findFirst({
          where: {
            buildingId: building.id,
            roomNo: createStudentDto.dormRoom,
          },
        });
        if (room) {
          dormRoomId = room.id;
          
          // 如果提供了床位号，查找或创建对应的床�?          if (createStudentDto.dormBed) {
            let bed = await this.prisma.dormBed.findFirst({
              where: {
                roomId: room.id,
                bedNo: createStudentDto.dormBed,
              },
            });
            // 如果床位不存在，自动创建
            if (!bed) {
              bed = await this.prisma.dormBed.create({
                data: {
                  roomId: room.id,
                  bedNo: createStudentDto.dormBed,
                  status: 'empty',
                },
              });
            }
            dormBedId = bed.id;
          }
        }
      }
    }

    const hashedPassword = await bcrypt.hash(createStudentDto.studentNo, 10);

    // 查找 STUDENT 角色�?ID
    const studentRole = await this.prisma.roles.findUnique({
      where: { code: 'STUDENT' },
    });

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          account: createStudentDto.studentNo,
          password: hashedPassword,
          name: createStudentDto.name,
          role: 'STUDENT',
          roleId: studentRole?.id,
          status: 'ACTIVE',
        },
      });

      const student = await tx.students.create({
        data: {
          userId: user.id,
          studentNo: createStudentDto.studentNo,
          gender: createStudentDto.gender,
          idCard: createStudentDto.idCard,
          entryYear: createStudentDto.entryYear,
          gradeId: createStudentDto.gradeId,
          classId: createStudentDto.classId,
          seatNo: createStudentDto.seatNo,
          dormRoomId: dormRoomId,
          dormBedId: dormBedId,
          boardingType: createStudentDto.boardingType || 'day',
        },
        include: {
          user: { select: { id: true, name: true, account: true } },
          grade: true,
          class: true,
          dormRoom: {
            include: {
              building: { select: { name: true } },
            },
          },
          dormBed: true,
        },
      });

      // 如果分配了床位，更新床位状�?      if (dormBedId) {
        await tx.dormBed.update({
          where: { id: dormBedId },
          data: { status: 'occupied', studentId: student.id },
        });
      }

      // 为学生自动添加本班数据范�?      await tx.dataScope.create({
        data: {
          userId: user.id,
          scopeType: 'class',
          scopeId: createStudentDto.classId,
        },
      });

      return student;
    });
  }

  async findAll(query?: QueryStudentDto) {
    const where: any = {};

    if (query?.gradeId) {
      where.gradeId = query.gradeId;
    }

    if (query?.classId) {
      where.classId = query.classId;
    }

    if (query?.search) {
      where.OR = [
        { studentNo: { contains: query.search } },
        { user: { name: { contains: query.search } } },
      ];
    }

    const students = await this.prisma.students.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, account: true, status: true } },
        grade: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        dormRoom: {
          include: {
            building: { select: { name: true } },
          },
        },
        dormBed: true,
      },
      orderBy: [{ gradeId: 'asc' }, { classId: 'asc' }, { studentNo: 'asc' }],
    });

    // 格式化返回数据，包含宿舍信息
    return students.map(student => ({
      ...students,
      dormBuilding: student.dormRoom?.building?.name || null,
      dormRoom: student.dormRoom?.roomNo || null,
      dormBed: student.dormBed?.bedNo || null,
    }));
  }

  async findOne(id: string) {
    const student = await this.prisma.students.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, account: true, status: true, createdAt: true } },
        grade: true,
        class: true,
        dormRoom: {
          include: {
            building: { select: { name: true } },
          },
        },
        dormBed: true,
        profileHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('学生不存�?);
    }

    return {
      ...students,
      dormBuilding: student.dormRoom?.building?.name || null,
      dormRoom: student.dormRoom?.roomNo || null,
      dormBed: student.dormBed?.bedNo || null,
    };
  }

  async update(id: string, updateStudentDto: UpdateStudentDto, updatedBy: string) {
    const student = await this.prisma.students.findUnique({ 
      where: { id },
      include: { dormBed: true },
    });
    if (!student) {
      throw new NotFoundException('学生不存�?);
    }

    // 处理宿舍关联
    let dormRoomId: string | undefined | null = updateStudentDto.dormRoomId;
    let dormBedId: string | undefined | null = updateStudentDto.dormBedId;

    console.log('Update student dorm info:', {
      dormBuilding: updateStudentDto.dormBuilding,
      dormRoom: updateStudentDto.dormRoom,
      dormBed: updateStudentDto.dormBed,
      boardingType: updateStudentDto.boardingType,
    });

    // 如果提供了宿舍楼栋和房间号，查找对应的宿舍ID
    if (updateStudentDto.dormBuilding && updateStudentDto.dormRoom) {
      const building = await this.prisma.dormBuilding.findUnique({
        where: { name: updateStudentDto.dormBuilding },
      });
      console.log('Found building:', building);
      
      if (building) {
        const room = await this.prisma.dormRoom.findFirst({
          where: {
            buildingId: building.id,
            roomNo: updateStudentDto.dormRoom,
          },
        });
        console.log('Found room:', room);
        
        if (room) {
          dormRoomId = room.id;
          
          // 如果提供了床位号，查找或创建对应的床�?          if (updateStudentDto.dormBed) {
            let bed = await this.prisma.dormBed.findFirst({
              where: {
                roomId: room.id,
                bedNo: updateStudentDto.dormBed,
              },
            });
            console.log('Found bed:', bed);
            
            // 如果床位不存在，自动创建
            if (!bed) {
              bed = await this.prisma.dormBed.create({
                data: {
                  roomId: room.id,
                  bedNo: updateStudentDto.dormBed,
                  status: 'empty',
                },
              });
              console.log('Created bed:', bed);
            }
            dormBedId = bed.id;
          } else {
            dormBedId = null;
          }
        }
      }
    } else if (updateStudentDto.dormBuilding === '' || updateStudentDto.dormRoom === '') {
      // 清空宿舍信息
      dormRoomId = null;
      dormBedId = null;
    }

    console.log('Final dorm IDs:', { dormRoomId, dormBedId });

    const updated = await this.prisma.$transaction(async (tx) => {
      // 如果之前有床位，释放之前的床�?      if (student.dormBedId && student.dormBedId !== dormBedId) {
        await tx.dormBed.update({
          where: { id: student.dormBedId },
          data: { status: 'empty', studentId: null },
        });
      }

      // 如果分配了新床位，更新新床位状�?      if (dormBedId && dormBedId !== student.dormBedId) {
        const bed = await tx.dormBed.findUnique({
          where: { id: dormBedId },
        });
        if (bed && bed.studentId && bed.studentId !== id) {
          throw new BadRequestException('该床位已被其他学生占�?);
        }
        await tx.dormBed.update({
          where: { id: dormBedId },
          data: { status: 'occupied', studentId: id },
        });
      }

      // 如果提供了姓名，更新 user �?      if (updateStudentDto.name) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: updateStudentDto.name },
        });
      }

      // 构建更新数据，排除不需要直接更新到 student 表的字段
      const { name, dormBuilding, dormRoom, dormBed, dormRoomId: dtoRoomId, dormBedId: dtoBedId, ...studentUpdateData } = updateStudentDto;

      const updatedStudent = await tx.students.update({
        where: { id },
        data: {
          ...studentUpdateData,
          dormRoomId,
          dormBedId,
        },
        include: {
          user: { select: { id: true, name: true } },
          grade: true,
          class: true,
          dormRoom: {
            include: {
              building: { select: { name: true } },
            },
          },
          dormBed: true,
        },
      });

      return updatedStudent;
    });

    if (updateStudentDto.classId || updateStudentDto.seatNo || dormRoomId !== undefined || updateStudentDto.boardingType) {
      await this.prisma.studentProfileHistory.create({
        data: {
          studentId: id,
          term: new Date().getFullYear() + '-' + (new Date().getMonth() >= 8 ? '1' : '2'),
          classId: updateStudentDto.classId || student.classId,
          seatNo: updateStudentDto.seatNo || student.seatNo,
          dormBuilding: updateStudentDto.dormBuilding || null,
          dormRoom: updateStudentDto.dormRoom || null,
          dormBed: updateStudentDto.dormBed || null,
          boardingType: updateStudentDto.boardingType || student.boardingType,
          updatedBy,
        },
      });
    }

    return {
      ...updated,
      dormBuilding: updated.dormRoom?.building?.name || null,
      dormRoom: updated.dormRoom?.roomNo || null,
      dormBed: updated.dormBed?.bedNo || null,
    };
  }

  async remove(id: string) {
    const student = await this.prisma.students.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('学生不存�?);
    }

    return this.prisma.$transaction(async (tx) => {
      // 如果学生有床位，释放床位
      if (student.dormBedId) {
        await tx.dormBed.update({
          where: { id: student.dormBedId },
          data: { status: 'empty', studentId: null },
        });
      }

      await tx.students.delete({ where: { id } });
      await tx.user.delete({ where: { id: student.userId } });
      return { message: '删除成功' };
    });
  }

  async batchImport(students: CreateStudentDto[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; message: string }[],
    };

    for (let i = 0; i < students.length; i++) {
      try {
        await this.create(students[i]);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          message: error.message,
        });
      }
    }

    return results;
  }
}
