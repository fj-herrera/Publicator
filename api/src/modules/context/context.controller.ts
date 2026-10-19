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
import { ContextService } from './context.service.js';
import { CreateContextDto } from './dto/create-context.dto.js';
import { UpdateContextDto } from './dto/update-context.dto.js';

@Controller('contexts')
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @Post()
  create(@Body() createContextDto: CreateContextDto) {
    return this.contextService.create(createContextDto.name);
  }

  @Get()
  findAll() {
    return this.contextService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contextService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContextDto: UpdateContextDto) {
      return this.contextService.update(id, updateContextDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contextService.remove(id);
  }
}
