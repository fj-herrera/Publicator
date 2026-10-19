import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicationAssetDto } from './create-publication-asset.dto.js';

export class UpdatePublicationAssetDto extends PartialType(CreatePublicationAssetDto) {}