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
import { PublicationSkillGroupService } from './publication-skill-group.service.js';
import { CreatePublicationSkillGroupDto } from './dto/create-publication-skill-group.dto.js';
import { UpdatePublicationSkillGroupDto } from './dto/update-publication-skill-group.dto.js';

@Controller('publication-skill-groups')
export class PublicationSkillGroupController {
  constructor(private readonly publicationSkillGroupService: PublicationSkillGroupService) {}

  @Post()
  create(@Body() dto: CreatePublicationSkillGroupDto) {
    return this.publicationSkillGroupService.create(dto);
  }

  @Get()
  findAll() {
    return this.publicationSkillGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publicationSkillGroupService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePublicationSkillGroupDto) {
    return this.publicationSkillGroupService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.publicationSkillGroupService.remove(id);
  }
}