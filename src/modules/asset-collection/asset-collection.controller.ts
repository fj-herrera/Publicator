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
import { AssetCollectionService } from './asset-collection.service.js';
import { CreateAssetCollectionDto } from './dto/create-asset-collection.dto.js';
import { UpdateAssetCollectionDto } from './dto/update-asset-collection.dto.js';

@Controller('asset-collection')
export class AssetCollectionController {
  constructor(
    private readonly assetCollectionService: AssetCollectionService,
  ) {}

  @Post()
  create(
    @Body() createAssetCollectionDto: CreateAssetCollectionDto,
  ) {
    return this.assetCollectionService.create(
      createAssetCollectionDto,
    );
  }

  @Get()
  findAll() {
    return this.assetCollectionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assetCollectionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetCollectionDto: UpdateAssetCollectionDto,
  ) {
    return this.assetCollectionService.update(
      id,
      updateAssetCollectionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assetCollectionService.remove(id);
  }
}