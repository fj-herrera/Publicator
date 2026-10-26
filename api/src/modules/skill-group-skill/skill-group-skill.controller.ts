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
import { SkillGroupSkillService } from './skill-group-skill.service.js';
import { CreateSkillGroupSkillDto } from './dto/create-skill-group-skill.dto.js';
import { UpdateSkillGroupSkillDto } from './dto/update-skill-group-skill.dto.js';

@Controller('skill-group-skills')
export class SkillGroupSkillController {
  constructor(private readonly skillGroupSkillService: SkillGroupSkillService) {}

  @Post()
  create(@Body() dto: CreateSkillGroupSkillDto) {
    return this.skillGroupSkillService.create(dto);
  }

  @Get()
  findAll() {
    return this.skillGroupSkillService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillGroupSkillService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSkillGroupSkillDto) {
    return this.skillGroupSkillService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.skillGroupSkillService.remove(id);
  }
}