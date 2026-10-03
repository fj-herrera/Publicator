import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetTextService } from './asset-text.service.js';
import { AssetTextController } from './asset-text.controller.js';
import { AssetText } from './entities/asset-text.entity.js';
import { Asset } from '../asset/entities/asset.entity.js';
import { Text } from '../text/entities/text.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AssetText, Asset, Text])],
  controllers: [AssetTextController],
  providers: [AssetTextService],
})
export class AssetTextModule {}
