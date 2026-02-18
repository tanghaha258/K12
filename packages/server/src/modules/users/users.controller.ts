import { Controller, Get, Post, Patch, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../../common/types/express.d';

@ApiTags('用户')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户详细信息' })
  async getMe(@Request() req: RequestWithUser) {
    return this.usersService.findById(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  async getUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const size = parseInt(pageSize || '10', 10);
    return this.usersService.findAll({ role, status, search }, pageNum, size);
  }

  @Post('import')
  @ApiOperation({ summary: '批量导入用户账号' })
  async importUsers(
    @Body() data: {
      type: 'STUDENT' | 'TEACHER';
      users: any[];
    },
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.batchImport(data.type, data.users, req.user.id);
  }

  @Post('batch/password-reset')
  @ApiOperation({ summary: '批量重置密码' })
  async batchResetPassword(
    @Body() data: { userIds: string[] },
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.batchResetPassword(data.userIds, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新用户状�? })
  async updateStatus(
    @Param('id') id: string,
    @Body() data: { status: string },
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.updateStatus(id, data.status, req.user.id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: '分配用户角色' })
  async assignRole(
    @Param('id') id: string,
    @Body() data: { roleId: string },
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.assignRole(id, data.roleId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  async getUserDetail(@Param('id') id: string) {
    return this.usersService.findDetailById(id);
  }
}
