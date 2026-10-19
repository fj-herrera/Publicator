import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DimensionsService } from './dimensions.service.js';
import { DimensionsController } from './dimensions.controller.js';
import { Dimensions } from './entities/dimensions.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Dimensions])],
  controllers: [DimensionsController],
  providers: [DimensionsService],
})
export class DimensionsModule {}
