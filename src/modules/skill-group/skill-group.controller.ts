import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SkillGroupService } from './skill-group.service.js';
import { CreateSkillGroupDto } from './dto/create-skill-group.dto.js';
import { UpdateSkillGroupDto } from './dto/update-skill-group.dto.js';

@Controller('skill-group')
export class SkillGroupController {
  constructor(
    private readonly skillGroupService: SkillGroupService,
  ) {}

  @Post()
  create(@Body() createSkillGroupDto: CreateSkillGroupDto) {
    return this.skillGroupService.create(createSkillGroupDto);
  }

  @Get()
  findAll() {
    return this.skillGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillGroupService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSkillGroupDto: UpdateSkillGroupDto,
  ) {
    return this.skillGroupService.update(id, updateSkillGroupDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.skillGroupService.remove(id);
  }
}