import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { DimensionsService } from './dimensions.service.js';
import { CreateDimensionsDto } from './dto/create-dimensions.dto.js';
import { UpdateDimensionsDto } from './dto/update-dimensions.dto.js';

@Controller('dimensions')
export class DimensionsController {
  constructor(private readonly dimensionsService: DimensionsService) {}

  @Post()
  create(@Body() createDimensionsDto: CreateDimensionsDto) {
    return this.dimensionsService.create(createDimensionsDto);
  }

  @Get()
  findAll() {
    return this.dimensionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dimensionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDimensionsDto: UpdateDimensionsDto,
  ) {
    return this.dimensionsService.update(id, updateDimensionsDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dimensionsService.remove(id);
  }
}