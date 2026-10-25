import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextService } from './context.service.js';
import { ContextController } from './context.controller.js';
import { Context } from './entities/context.entity.js';
import { PublicationContext } from '../publication-context/entities/publication-context.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Context, PublicationContext])],
  controllers: [ContextController],
  providers: [ContextService],
})
export class ContextModule {}
