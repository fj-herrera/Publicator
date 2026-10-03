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
import { ContentService } from './content.service.js';
import { CreateContentDto } from './dto/create-content.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';

@Controller('content')
export class ContentController {
    constructor(private readonly contentService: ContentService) {}

    @Post()
    create(@Body() createContentDto: CreateContentDto) {
        return this.contentService.create(createContentDto);
    }

    @Get()
    findAll() {
      return this.contentService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.contentService.findOne(id);
    }

    @Patch(':id')
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateContentDto: UpdateContentDto,
    ) {
      return this.contentService.update(id, updateContentDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.contentService.remove(id);
    }
}