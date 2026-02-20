import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MoralService } from './moral.service';
import {
  CreateMoralRuleDto,
  UpdateMoralRuleDto,
  QueryMoralRuleDto,
  CreateMoralEventDto,
  BatchCreateMoralEventDto,
  CancelMoralEventDto,
  QueryMoralEventDto,
  QueryMoralStatsDto,
  QueryDormMoralDto,
} from './dto/moral.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../../common/types/express.d';

@ApiTags('德育量化管理')
@Controller('moral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MoralController {
  constructor(private readonly moralService: MoralService) {}

  // ========== 德育规则管理 ==========

  @Post('rules')
  @ApiOperation({ summary: '创建德育规则' })
  createRule(@Body() createDto: CreateMoralRuleDto) {
    return this.moralService.createRule(createDto);
  }

  @Get('rules')
  @ApiOperation({ summary: '获取德育规则列表' })
  findAllRules(@Query() query: QueryMoralRuleDto) {
    return this.moralService.findAllRules(query);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: '获取德育规则详情' })
  findRuleById(@Param('id') id: string) {
    return this.moralService.findRuleById(id);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: '更新德育规则' })
  updateRule(@Param('id') id: string, @Body() updateDto: UpdateMoralRuleDto) {
    return this.moralService.updateRule(id, updateDto);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: '删除德育规则' })
  deleteRule(@Param('id') id: string) {
    return this.moralService.deleteRule(id);
  }

  // ========== 德育事件管理 ==========

  @Post('events')
  @ApiOperation({ summary: '创建德育事件' })
  createEvent(
    @Body() createDto: CreateMoralEventDto,
    @Request() req: RequestWithUser
  ) {
    return this.moralService.createEvent(createDto, req.user.id);
  }

  @Post('events/batch')
  @ApiOperation({ summary: '批量创建德育事件' })
  batchCreateEvent(
    @Body() batchDto: BatchCreateMoralEventDto,
    @Request() req: RequestWithUser
  ) {
    return this.moralService.batchCreateEvent(batchDto, req.user.id);
  }

  @Get('events')
  @ApiOperation({ summary: '获取德育事件列表' })
  findAllEvents(@Query() query: QueryMoralEventDto) {
    return this.moralService.findAllEvents(query);
  }

  @Get('events/:id')
  @ApiOperation({ summary: '获取德育事件详情' })
  findEventById(@Param('id') id: string) {
    return this.moralService.findEventById(id);
  }

  @Patch('events/:id/cancel')
  @ApiOperation({ summary: '撤销德育事件' })
  cancelEvent(
    @Param('id') id: string,
    @Body() cancelDto: CancelMoralEventDto,
    @Request() req: RequestWithUser
  ) {
    return this.moralService.cancelEvent(id, cancelDto, req.user.id);
  }

  // ========== 德育统计 ==========

  @Get('stats/students')
  @ApiOperation({ summary: '获取学生德育统计' })
  getStudentStats(@Query() query: QueryMoralStatsDto) {
    return this.moralService.getStudentStats(query);
  }

  @Get('stats/classes')
  @ApiOperation({ summary: '获取班级德育统计' })
  getClassStats(@Query() query: QueryMoralStatsDto) {
    return this.moralService.getClassStats(query);
  }

  @Get('stats/categories')
  @ApiOperation({ summary: '获取分类德育统计' })
  getCategoryStats(@Query() query: QueryMoralStatsDto) {
    return this.moralService.getCategoryStats(query);
  }

  // ========== Excel批量导入 ==========

  @Post('import')
  @ApiOperation({ summary: '批量导入德育事件（Excel）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importEvents(
    @UploadedFile() file: any,
    @Request() req: RequestWithUser
  ) {
    return this.moralService.importEvents(file.buffer, req.user.id);
  }

  @Get('import/template')
  @ApiOperation({ summary: '下载导入模板' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.moralService.getImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="德育事件导入模板.xlsx"');
    res.send(buffer);
  }

  // ========== 宿舍德育管理 ==========

  @Get('dorm/events')
  @ApiOperation({ summary: '获取宿舍德育事件列表' })
  findDormEvents(@Query() query: QueryDormMoralDto) {
    return this.moralService.findDormEvents(query);
  }

  @Get('dorm/stats')
  @ApiOperation({ summary: '获取宿舍德育统计（支持混合宿舍）' })
  getDormStats(@Query() query: QueryDormMoralDto) {
    return this.moralService.getDormStats(query);
  }

  @Get('dorm/buildings')
  @ApiOperation({ summary: '获取宿舍楼统计' })
  getBuildingStats(@Query() query: QueryDormMoralDto) {
    return this.moralService.getBuildingStats(query);
  }
}
