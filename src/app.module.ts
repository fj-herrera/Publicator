import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeModule } from './modules/type/type.module.js';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from './modules/client/client.module.js';
import { ContextModule } from './modules/context/context.module.js';
import { TextModule } from './modules/text/text.module.js';
import { TagModule } from './modules/tag/tag.module.js';
import { SkillModule } from './modules/skill/skill.module.js';
import { DimensionsModule } from './modules/dimensions/dimensions.module.js';
import { MetaModule } from './modules/meta/meta.module.js';
import { PublicationModule } from './modules/publication/publication.module.js';
import { ContentModule } from './modules/content/content.module.js';
import { CollectionModule } from './modules/collection/collection.module.js';
import { SkillsModule } from './modules/skills/skills.module.js';
import { SkillGroupModule } from './modules/skill-group/skill-group.module.js';
import { PublicationTagModule } from './modules/publication-tag/publication-tag.module.js';
import { AssetModule } from './modules/asset/asset.module.js';
import { AssetCollectionModule } from './modules/asset-collection/asset-collection.module.js';
import { AssetTextModule } from './modules/asset-text/asset-text.module.js';
import { PublicationContextModule } from './modules/publication-context/publication-context.module.js';
import { TextContentModule } from './modules/text-content/text-content.module.js';
import { PublicationAssetModule } from './modules/publication-asset/publication-asset.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),

        autoLoadEntities: true,
      }),
    }),

    TypeModule,
    ClientModule,
    ContextModule,
    TextModule,
    TagModule,
    SkillModule,
    DimensionsModule,
    MetaModule,
    PublicationModule,
    ContentModule,
    CollectionModule,
    SkillsModule,
    SkillGroupModule,
    PublicationTagModule,
    AssetModule,
    AssetCollectionModule,
    AssetTextModule,
    PublicationContextModule,
    TextContentModule,
    PublicationAssetModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
