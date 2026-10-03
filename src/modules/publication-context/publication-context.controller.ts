import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PublicationContextService } from './publication-context.service.js';
import { CreatePublicationContextDto } from './dto/create-publication-context.dto.js';
import { UpdatePublicationContextDto } from './dto/update-publication-context.dto.js';

@Controller('publication-context')
export class PublicationContextController {
  constructor(private readonly publicationContextService: PublicationContextService) {}

  @Post()
  create(@Body() createPublicationContextDto: CreatePublicationContextDto) {
    return this.publicationContextService.create(createPublicationContextDto);
  }

  @Get()
  findAll() {
    return this.publicationContextService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicationContextService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePublicationContextDto: UpdatePublicationContextDto) {
    return this.publicationContextService.update(+id, updatePublicationContextDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.publicationContextService.remove(+id);
  }
}
