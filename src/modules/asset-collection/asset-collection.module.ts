import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetCollectionService } from './asset-collection.service.js';
import { AssetCollectionController } from './asset-collection.controller.js';
import { AssetCollection } from './entities/asset-collection.entity.js';
import { Collection } from '../collection/entities/collection.entity.js';
import { Asset } from '../asset/entities/asset.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AssetCollection, Collection, Asset])],
  controllers: [AssetCollectionController],
  providers: [AssetCollectionService],
})
export class AssetCollectionModule {}
