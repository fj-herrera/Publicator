import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetTextDto } from './create-asset-text.dto.js';

export class UpdateAssetTextDto extends PartialType(CreateAssetTextDto) {}
