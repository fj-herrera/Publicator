import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetCollectionDto } from './create-asset-collection.dto.js';

export class UpdateAssetCollectionDto extends PartialType(CreateAssetCollectionDto) {}
