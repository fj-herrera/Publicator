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
import { MetaService } from './meta.service.js';
import { CreateMetaDto } from './dto/create-meta.dto.js';
import { UpdateMetaDto } from './dto/update-meta.dto.js';

@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Post()
  create(@Body() createMetaDto: CreateMetaDto) {
    return this.metaService.create(createMetaDto);
  }

  @Get()
  findAll() {
    return this.metaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.metaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMetaDto: UpdateMetaDto,
  ) {
    return this.metaService.update(id, updateMetaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.metaService.remove(id);
  }
}