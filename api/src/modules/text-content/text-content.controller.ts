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
import { TextContentService } from './text-content.service.js';
import { CreateTextContentDto } from './dto/create-text-content.dto.js';
import { UpdateTextContentDto } from './dto/update-text-content.dto.js';

@Controller('text-contents')
export class TextContentController {
  constructor(
    private readonly textContentService: TextContentService,
  ) {}

  @Post()
  create(@Body() createTextContentDto: CreateTextContentDto) {
    return this.textContentService.create(
      createTextContentDto,
    );
  }
  
  @Get()
  findAll() {
    return this.textContentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.textContentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTextContentDto: UpdateTextContentDto,
  ) {
    return this.textContentService.update(
      id,
      updateTextContentDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.textContentService.remove(id);
  }
}
