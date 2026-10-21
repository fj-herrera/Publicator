import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeController } from './type.controller.js';
import { TypeService } from './type.service.js';
import { Type } from './entities/type.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Type, Publication])],
  controllers: [TypeController],
  providers: [TypeService],
})
export class TypeModule {}
