import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetService } from './asset.service.js';
import { AssetController } from './asset.controller.js';
import { Asset } from './entities/asset.entity.js';
import { MediaStorageModule } from '../media/media-storage.module.js';
import { Dimensions } from '../dimensions/entities/dimensions.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Dimensions]), MediaStorageModule],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
