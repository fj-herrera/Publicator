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
import { PublicationSkillsService } from './publication-skills.service.js';
import { CreatePublicationSkillsDto } from './dto/create-publication-skills.dto.js';
import { UpdatePublicationSkillsDto } from './dto/update-publication-skills.dto.js';

@Controller('publication-skills')
export class PublicationSkillsController {
  constructor(private readonly publicationSkillsService: PublicationSkillsService) {}

  @Post()
  create(@Body() createPublicationSkillsDto: CreatePublicationSkillsDto) {
    return this.publicationSkillsService.create(createPublicationSkillsDto);
  }

  @Get()
  findAll() {
    return this.publicationSkillsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publicationSkillsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePublicationSkillsDto: UpdatePublicationSkillsDto,
  ) {
    return this.publicationSkillsService.update(id, updatePublicationSkillsDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.publicationSkillsService.remove(id);
  }
}