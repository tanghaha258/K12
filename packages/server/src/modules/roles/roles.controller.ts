import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('角色权限')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  async getRoles() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  async getRole(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  async createRole(
    @Body() data: {
      name: string;
      code: string;
      description?: string;
      permissions?: string[];
    },
  ) {
    return this.rolesService.create(data);
  }

  @Post(':id/copy')
  @ApiOperation({ summary: '复制角色' })
  async copyRole(
    @Param('id') id: string,
    @Body() data: { name: string; code: string },
  ) {
    return this.rolesService.copy(id, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色' })
  async updateRole(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      description?: string;
      permissions?: string[];
    },
  ) {
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: '获取角色权限' })
  async getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getPermissions(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: '设置角色权限' })
  async setRolePermissions(
    @Param('id') id: string,
    @Body() data: { permissions: string[] },
  ) {
    return this.rolesService.setPermissions(id, data.permissions);
  }

  @Get('menu/list')
  @ApiOperation({ summary: '获取菜单列表' })
  async getMenus() {
    return this.rolesService.getMenus();
  }
}
