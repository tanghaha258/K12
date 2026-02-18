import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DormsService {
  constructor(private prisma: PrismaService) {}

  // 宿舍楼栋管理
  async createBuilding(data: { name: string; floors: number; roomsPerFloor: number }) {
    return this.prisma.dorm_buildings.create({
      data: {
        name: data.name,
        floors: data.floors,
        roomsPerFloor: data.roomsPerFloor,
      },
    });
  }

  async findAllBuildings() {
    return this.prisma.dorm_buildings.findMany({
      include: {
        _count: {
          select: { dorm_rooms: true },
        },
      },
    });
  }

  async findBuildingById(id: string) {
    const building = await this.prisma.dorm_buildings.findUnique({
      where: { id },
      include: {
        dorm_rooms: {
          include: {
            _count: {
              select: { dorm_beds: true },
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

  async updateBuilding(id: string, data: { name?: string; floors?: number; roomsPerFloor?: number }) {
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

  // 宿舍房间管理
  async createRoom(data: { buildingId: string; roomNo: string; capacity: number; roomType?: string }) {
    const building = await this.prisma.dorm_buildings.findUnique({
      where: { id: data.buildingId },
    });

    if (!building) {
      throw new NotFoundException('楼栋不存在');
    }

    return this.prisma.dorm_rooms.create({
      data: {
        buildingId: data.buildingId,
        roomNo: data.roomNo,
        capacity: data.capacity,
        roomType: data.roomType || 'standard',
      },
    });
  }

  async findAllRooms(query?: { buildingId?: string; status?: string }) {
    const where: any = {};
    if (query?.buildingId) {
      where.buildingId = query.buildingId;
    }

    return this.prisma.dorm_rooms.findMany({
      where,
      include: {
        dorm_buildings: true,
        _count: {
          select: { dorm_beds: true, students: true },
        },
      },
    });
  }

  async findRoomById(id: string) {
    const room = await this.prisma.dorm_rooms.findUnique({
      where: { id },
      include: {
        dorm_buildings: true,
        dorm_beds: {
          include: {
            students: {
              include: {
                users: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('宿舍不存在');
    }

    return room;
  }

  async updateRoom(id: string, data: { roomNo?: string; capacity?: number; roomType?: string }) {
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
  async createBed(data: { roomId: string; bedNo: string }) {
    const room = await this.prisma.dorm_rooms.findUnique({
      where: { id: data.roomId },
    });

    if (!room) {
      throw new NotFoundException('宿舍不存在');
    }

    return this.prisma.dorm_beds.create({
      data: {
        roomId: data.roomId,
        bedNo: data.bedNo,
      },
    });
  }

  // 学生入住
  async assignStudent(data: { studentId: string; roomId: string; bedId: string }) {
    const student = await this.prisma.students.findUnique({
      where: { id: data.studentId },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const room = await this.prisma.dorm_rooms.findUnique({
      where: { id: data.roomId },
    });

    if (!room) {
      throw new NotFoundException('宿舍不存在');
    }

    const bed = await this.prisma.dorm_beds.findUnique({
      where: { id: data.bedId },
    });

    if (!bed) {
      throw new NotFoundException('床位不存在');
    }

    if (bed.studentId) {
      throw new BadRequestException('该床位已被占用');
    }

    // 更新学生住宿信息
    await this.prisma.students.update({
      where: { id: data.studentId },
      data: {
        dormRoomId: data.roomId,
        dormBedId: data.bedId,
        boardingType: 'boarding',
      },
    });

    // 更新床位占用状态
    await this.prisma.dorm_beds.update({
      where: { id: data.bedId },
      data: { studentId: data.studentId },
    });

    return { success: true };
  }

  // 学生退宿
  async removeStudent(studentId: string) {
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
    const [buildings, rooms, beds, occupiedBeds] = await Promise.all([
      this.prisma.dorm_buildings.count(),
      this.prisma.dorm_rooms.count(),
      this.prisma.dorm_beds.count(),
      this.prisma.dorm_beds.count({ where: { studentId: { not: null } } }),
    ]);

    return {
      buildings,
      rooms,
      beds,
      occupiedBeds,
      vacantBeds: beds - occupiedBeds,
      occupancyRate: beds > 0 ? (occupiedBeds / beds) * 100 : 0,
    };
  }
}
