import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DormsService } from './dorms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dorms')
@UseGuards(JwtAuthGuard)
export class DormsController {
  constructor(private readonly dormsService: DormsService) {}

  // ===== 宿舍楼管理 =====
  @Get('buildings')
  async getBuildings() {
    return this.dormsService.getBuildings();
  }

  @Post('buildings')
  async createBuilding(@Body() data: {
    name: string;
    floors: number;
    remark?: string;
  }) {
    return this.dormsService.createBuilding(data);
  }

  @Patch('buildings/:id')
  async updateBuilding(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      floors?: number;
      remark?: string;
      status?: string;
    },
  ) {
    return this.dormsService.updateBuilding(id, data);
  }

  @Delete('buildings/:id')
  async deleteBuilding(@Param('id') id: string) {
    return this.dormsService.deleteBuilding(id);
  }

  @Post('buildings/import')
  async importBuildings(@Body() data: { buildings: { name: string; floors?: number; remark?: string }[] }) {
    return this.dormsService.batchImportBuildings(data.buildings);
  }

  // ===== 宿舍房间管理 =====
  @Get('rooms')
  async getRooms(@Query('buildingId') buildingId?: string) {
    return this.dormsService.getRooms(buildingId);
  }

  @Post('rooms')
  async createRoom(@Body() data: {
    buildingId: string;
    roomNo: string;
    floor: number;
    capacity?: number;
    beds?: number;
    gender?: string;
    remark?: string;
  }) {
    return this.dormsService.createRoom(data);
  }

  @Patch('rooms/:id')
  async updateRoom(
    @Param('id') id: string,
    @Body() data: {
      roomNo?: string;
      floor?: number;
      capacity?: number;
      beds?: number;
      gender?: string;
      remark?: string;
      status?: string;
    },
  ) {
    return this.dormsService.updateRoom(id, data);
  }

  @Delete('rooms/:id')
  async deleteRoom(@Param('id') id: string) {
    return this.dormsService.deleteRoom(id);
  }

  // ===== 床位管理 =====
  @Get('beds')
  async getBeds(@Query('roomId') roomId?: string) {
    return this.dormsService.getBeds(roomId);
  }

  @Post('rooms/:roomId/beds')
  async createBeds(
    @Param('roomId') roomId: string,
    @Body() data: { count: number },
  ) {
    return this.dormsService.createBeds(roomId, data.count);
  }

  @Delete('beds/:id')
  async deleteBed(@Param('id') id: string) {
    return this.dormsService.deleteBed(id);
  }

  // ===== 住宿分配 =====
  @Post('assign')
  async assignStudent(@Body() data: {
    studentId: string;
    roomId: string;
    bedId: string;
  }) {
    return this.dormsService.assignStudent(data.studentId, data.roomId, data.bedId);
  }

  @Post('unassign')
  async unassignStudent(@Body() data: { studentId: string }) {
    return this.dormsService.unassignStudent(data.studentId);
  }

  // ===== 住宿统计 =====
  @Get('statistics')
  async getStatistics() {
    return this.dormsService.getStatistics();
  }

  @Get('buildings/:id/detail')
  async getBuildingDetail(@Param('id') id: string) {
    return this.dormsService.getBuildingDetail(id);
  }
}
