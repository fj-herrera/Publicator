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
import { PublicationTagService } from './publication-tag.service.js';
import { CreatePublicationTagDto } from './dto/create-publication-tag.dto.js';
import { UpdatePublicationTagDto } from './dto/update-publication-tag.dto.js';

@Controller('publication-tag')
export class PublicationTagController {
  constructor(
    private readonly publicationTagService: PublicationTagService,
  ) {}

  @Post()
  create(
    @Body() createPublicationTagDto: CreatePublicationTagDto,
  ) {
    return this.publicationTagService.create(
      createPublicationTagDto,
    );
  }

  @Get()
  findAll() {
    return this.publicationTagService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publicationTagService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePublicationTagDto: UpdatePublicationTagDto,
  ) {
    return this.publicationTagService.update(
      id,
      updatePublicationTagDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.publicationTagService.remove(id);
  }
}