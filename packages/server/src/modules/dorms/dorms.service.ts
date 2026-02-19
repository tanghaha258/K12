import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DormsService {
  constructor(private prisma: PrismaService) {}

  // 宿舍楼栋管理
  async getBuildings() {
    const buildings = await this.prisma.dorm_buildings.findMany({
      include: {
        _count: {
          select: { dorm_rooms: true },
        },
      },
    });
    
    // 格式化返回数据
    return buildings.map(building => ({
      id: building.id,
      name: building.name,
      floors: building.floors,
      rooms: building.rooms,
      beds: building.beds,
      remark: building.remark,
      status: building.status,
      createdAt: building.createdAt,
      roomCount: building._count?.dorm_rooms || 0,
    }));
  }

  async createBuilding(data: { name: string; floors: number; remark?: string }) {
    return this.prisma.dorm_buildings.create({
      data: {
        id: uuidv4(),
        name: data.name,
        floors: data.floors || 1,
        remark: data.remark,
        updatedAt: new Date(),
      },
    });
  }

  async updateBuilding(id: string, data: { name?: string; floors?: number; remark?: string; status?: string }) {
    const building = await this.prisma.dorm_buildings.findUnique({ where: { id } });
    if (!building) {
      throw new NotFoundException('楼栋不存在');
    }

    return this.prisma.dorm_buildings.update({
      where: { id },
      data,
    });
  }

  async deleteBuilding(id: string) {
    const building = await this.prisma.dorm_buildings.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dorm_rooms: true },
        },
      },
    });

    if (!building) {
      throw new NotFoundException('楼栋不存在');
    }

    if (building._count.dorm_rooms > 0) {
      throw new BadRequestException('该楼栋下还有宿舍，无法删除');
    }

    return this.prisma.dorm_buildings.delete({ where: { id } });
  }

  async batchImportBuildings(buildings: { name: string; floors?: number; remark?: string }[]) {
    const results = { success: 0, failed: 0, errors: [] as any[] };
    
    for (const building of buildings) {
      try {
        await this.createBuilding({
          name: building.name,
          floors: building.floors || 1,
          remark: building.remark,
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ name: building.name, error: error.message });
      }
    }
    
    return results;
  }

  async getBuildingDetail(id: string) {
    const building = await this.prisma.dorm_buildings.findUnique({
      where: { id },
      include: {
        dorm_rooms: {
          include: {
            _count: {
              select: { dorm_beds: true, students: true },
            },
          },
        },
      },
    });

    if (!building) {
      throw new NotFoundException('楼栋不存在');
    }

    return building;
  }

  // 宿舍房间管理
  async getRooms(buildingId?: string) {
    const where: any = {};
    if (buildingId) {
      where.buildingId = buildingId;
    }

    const rooms = await this.prisma.dorm_rooms.findMany({
      where,
      include: {
        dorm_buildings: true,
        _count: {
          select: { dorm_beds: true, students: true },
        },
      },
    });

    // 格式化返回数据
    return rooms.map(room => ({
      id: room.id,
      buildingId: room.buildingId,
      buildingName: room.dorm_buildings?.name || '',
      roomNo: room.roomNo,
      floor: room.floor,
      capacity: room.capacity,
      beds: room.beds,
      occupied: room._count?.students || 0,
      gender: room.gender,
      remark: room.remark,
      status: room.status,
    }));
  }

  async createRoom(data: { buildingId: string; roomNo: string; floor: number; capacity?: number; beds?: number; gender?: string; remark?: string }) {
    const building = await this.prisma.dorm_buildings.findUnique({
      where: { id: data.buildingId },
    });

    if (!building) {
      throw new NotFoundException('楼栋不存在');
    }

    return this.prisma.dorm_rooms.create({
      data: {
        id: uuidv4(),
        buildingId: data.buildingId,
        roomNo: data.roomNo,
        floor: data.floor,
        capacity: data.capacity || 4,
        beds: data.beds || 4,
        gender: data.gender || 'male',
        remark: data.remark,
        updatedAt: new Date(),
      },
    });
  }

  async updateRoom(id: string, data: { roomNo?: string; floor?: number; capacity?: number; beds?: number; gender?: string; remark?: string; status?: string }) {
    const room = await this.prisma.dorm_rooms.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('宿舍不存在');
    }

    return this.prisma.dorm_rooms.update({
      where: { id },
      data,
    });
  }

  async deleteRoom(id: string) {
    const room = await this.prisma.dorm_rooms.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('宿舍不存在');
    }

    if (room._count.students > 0) {
      throw new BadRequestException('该宿舍还有学生入住，无法删除');
    }

    await this.prisma.dorm_beds.deleteMany({ where: { roomId: id } });

    return this.prisma.dorm_rooms.delete({ where: { id } });
  }

  // 床位管理
  async getBeds(roomId?: string) {
    const where: any = {};
    if (roomId) {
      where.roomId = roomId;
    }

    return this.prisma.dorm_beds.findMany({
      where,
      include: {
        dorm_rooms: {
          include: {
            dorm_buildings: true,
          },
        },
        students: {
          include: {
            users: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async createBeds(roomId: string, count: number) {
    const room = await this.prisma.dorm_rooms.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('宿舍不存在');
    }

    const existingBeds = await this.prisma.dorm_beds.count({
      where: { roomId },
    });

    const beds = [];
    for (let i = 1; i <= count; i++) {
      const bed = await this.prisma.dorm_beds.create({
        data: {
          id: uuidv4(),
          roomId,
          bedNo: `${existingBeds + i}`,
          updatedAt: new Date(),
        },
      });
      beds.push(bed);
    }

    return beds;
  }

  async deleteBed(id: string) {
    const bed = await this.prisma.dorm_beds.findUnique({
      where: { id },
    });

    if (!bed) {
      throw new NotFoundException('床位不存在');
    }

    if (bed.studentId) {
      throw new BadRequestException('该床位已有学生入住，无法删除');
    }

    return this.prisma.dorm_beds.delete({ where: { id } });
  }

  // 学生入住
  async assignStudent(studentId: string, roomId: string, bedId: string) {
    const student = await this.prisma.students.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const room = await this.prisma.dorm_rooms.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('宿舍不存在');
    }

    const bed = await this.prisma.dorm_beds.findUnique({
      where: { id: bedId },
    });

    if (!bed) {
      throw new NotFoundException('床位不存在');
    }

    if (bed.studentId) {
      throw new BadRequestException('该床位已被占用');
    }

    // 更新学生住宿信息
    await this.prisma.students.update({
      where: { id: studentId },
      data: {
        dormRoomId: roomId,
        dormBedId: bedId,
        boardingType: 'boarding',
      },
    });

    // 更新床位占用状态
    await this.prisma.dorm_beds.update({
      where: { id: bedId },
      data: { studentId: studentId },
    });

    return { success: true };
  }

  // 学生退宿
  async unassignStudent(studentId: string) {
    const student = await this.prisma.students.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    if (!student.dormBedId) {
      throw new BadRequestException('该学生未入住宿舍');
    }

    // 释放床位
    await this.prisma.dorm_beds.update({
      where: { id: student.dormBedId },
      data: { studentId: null },
    });

    // 清除学生住宿信息
    await this.prisma.students.update({
      where: { id: studentId },
      data: {
        dormRoomId: null,
        dormBedId: null,
        boardingType: 'day',
      },
    });

    return { success: true };
  }

  // 获取宿舍统计
  async getStatistics() {
    const [buildings, rooms, beds, occupiedBeds, boardingStudents] = await Promise.all([
      this.prisma.dorm_buildings.count(),
      this.prisma.dorm_rooms.count(),
      this.prisma.dorm_beds.count(),
      this.prisma.dorm_beds.count({ where: { studentId: { not: null } } }),
      this.prisma.students.count({ where: { boardingType: 'boarding' } }),
    ]);

    return {
      buildings,
      rooms,
      beds,
      occupied: occupiedBeds,
      empty: beds - occupiedBeds,
      occupancyRate: beds > 0 ? (occupiedBeds / beds) * 100 : 0,
      boardingStudents,
    };
  }
}
