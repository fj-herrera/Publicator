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
import { PublicationAssetService } from './publication-asset.service.js';
import { CreatePublicationAssetDto } from './dto/create-publication-asset.dto.js';
import { UpdatePublicationAssetDto } from './dto/update-publication-asset.dto.js';

@Controller('publication-assets')
export class PublicationAssetController {
  constructor(private readonly publicationAssetService: PublicationAssetService) {}

  @Post()
  create(@Body() createPublicationAssetDto: CreatePublicationAssetDto) {
    return this.publicationAssetService.create(createPublicationAssetDto);
  }

  @Get()
  findAll() {
    return this.publicationAssetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publicationAssetService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePublicationAssetDto: UpdatePublicationAssetDto,
  ) {
    return this.publicationAssetService.update(id, updatePublicationAssetDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.publicationAssetService.remove(id);
  }
}