import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { TypeModule } from './type/type.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from './client/client.module.js';
import { ContextModule } from './context/context.module.js';
import { TextModule } from './text/text.module.js';
import { TagModule } from './tag/tag.module.js';
import { SkillModule } from './skill/skill.module.js';
import { UrlModule } from './url/url.module.js';

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
    UrlModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
