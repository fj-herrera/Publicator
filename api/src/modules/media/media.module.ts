import { Module } from '@nestjs/common'
import { AssetModule } from '../asset/asset.module.js'
import { MediaController } from './media.controller.js'

@Module({
  imports: [AssetModule],
  controllers: [MediaController],
})
export class MediaModule {}