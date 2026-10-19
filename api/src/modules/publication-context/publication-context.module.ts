import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationContextService } from './publication-context.service.js';
import { PublicationContextController } from './publication-context.controller.js';
import { PublicationContext } from './entities/publication-context.entity.js';
import { Publication } from '../publication/entities/publication.entity.js';
import { Context } from '../context/entities/context.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PublicationContext, Publication, Context])],
  controllers: [PublicationContextController],
  providers: [PublicationContextService],
})
export class PublicationContextModule {}
