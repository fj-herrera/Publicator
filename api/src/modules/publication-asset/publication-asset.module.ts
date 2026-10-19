import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationAssetService } from './publication-asset.service.js';
import { PublicationAssetController } from './publication-asset.controller.js';
import { PublicationAsset } from './entities/publication-asset.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { Asset } from '../asset/entities/asset.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PublicationAsset, Publication, Asset])],
  controllers: [PublicationAssetController],
  providers: [PublicationAssetService],
})
export class PublicationAssetModule {}