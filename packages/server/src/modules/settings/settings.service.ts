import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfigs() {
    return [];
  }

  async saveSchoolInfo(data: any) {
    return { success: true };
  }

  async getSchoolInfo() {
    return {};
  }

  async backupDatabase() {
    return '';
  }

  async restoreDatabase() {
    return { success: true };
  }

  async updateConfig(key: string, value: string) {
    return { success: true };
  }
}
