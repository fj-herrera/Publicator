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
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
