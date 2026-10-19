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
import { AssetTextService } from './asset-text.service.js';
import { CreateAssetTextDto } from './dto/create-asset-text.dto.js';
import { UpdateAssetTextDto } from './dto/update-asset-text.dto.js';

@Controller('asset-texts')
export class AssetTextController {
  constructor(
    private readonly assetTextService: AssetTextService,
  ) {}

  @Post()
  create(@Body() createAssetTextDto: CreateAssetTextDto) {
    return this.assetTextService.create(createAssetTextDto);
  }

  @Get()
  findAll() {
    return this.assetTextService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assetTextService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetTextDto: UpdateAssetTextDto,
  ) {
    return this.assetTextService.update(
      id,
      updateAssetTextDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assetTextService.remove(id);
  }
}