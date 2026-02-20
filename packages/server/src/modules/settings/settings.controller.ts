import { Controller, Get, Post, Body, Param, UseGuards, Req, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';

@ApiTags('系统设置')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('configs')
  @ApiOperation({ summary: '获取系统配置列表' })
  async getConfigs() {
    return this.settingsService.getConfigs();
  }

  @Post('school')
  @ApiOperation({ summary: '保存学校信息' })
  async saveSchoolInfo(@Body() data: {
    schoolName: string;
    schoolYear: string;
    currentTerm: string;
    principalName?: string;
    contactPhone?: string;
    address?: string;
  }) {
    return this.settingsService.saveSchoolInfo(data);
  }

  @Get('school')
  @ApiOperation({ summary: '获取学校信息' })
  async getSchoolInfo() {
    return this.settingsService.getSchoolInfo();
  }

  @Post('backup')
  @ApiOperation({ summary: '备份数据库' })
  async backupDatabase(@Res() res: Response) {
    const backupContent = await this.settingsService.backupDatabase();
    
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=backup_${new Date().toISOString().slice(0, 10)}.sql`);
    res.send(backupContent);
  }

  @Post('restore')
  @ApiOperation({ summary: '恢复数据库' })
  async restoreDatabase(@Req() req: any) {
    return this.settingsService.restoreDatabase();
  }

  @Post('config/:key')
  @ApiOperation({ summary: '更新配置项' })
  async updateConfig(
    @Param('key') key: string,
    @Body() data: { value: string },
  ) {
    return this.settingsService.updateConfig(key, data.value);
  }
}
