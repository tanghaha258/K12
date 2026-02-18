import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataScopeService } from './datascope.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('数据权限')
@Controller('datascopes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataScopeController {
  constructor(private readonly dataScopeService: DataScopeService) {}

  @Get()
  @ApiOperation({ summary: '获取数据权限列表' })
  async findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.dataScopeService.getUserDataScopes(userId);
    }
    const scopes = await this.dataScopeService['prisma'].data_scopes.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            account: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return scopes;
  }

  @Get('teachers')
  @ApiOperation({ summary: '获取可选教师列表' })
  async getTeachers() {
    const teachers = await this.dataScopeService['prisma'].teachers.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            account: true,
          },
        },
      },
    });
    return teachers;
  }

  @Get('my')
  @ApiOperation({ summary: '获取当前用户数据范围' })
  async getMyDataScopes(@Req() req: any) {
    const userId = req.user.userId;
    return this.dataScopeService.getUserDataScopes(userId);
  }

  @Get('user/:userId')
  async getUserDataScopes(@Param('userId') userId: string) {
    return this.dataScopeService.getUserDataScopes(userId);
  }

  @Post('user/:userId')
  async setUserDataScopes(
    @Param('userId') userId: string,
    @Body() data: {
      scopes: { scopeType: string; scopeId: string }[];
    },
  ) {
    return this.dataScopeService.setUserDataScopes(userId, data.scopes);
  }

  @Delete(':id')
  async deleteDataScope(@Param('id') id: string) {
    return this.dataScopeService.deleteDataScope(id);
  }

  @Post('check')
  async checkDataScope(
    @Req() req: any,
    @Body() data: { scopeType: string; scopeId: string },
  ) {
    const userId = req.user.userId;
    const hasScope = await this.dataScopeService.checkDataScope(
      userId,
      data.scopeType,
      data.scopeId,
    );
    return { hasScope };
  }
}
