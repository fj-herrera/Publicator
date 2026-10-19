import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicationTagDto } from './create-publication-tag.dto.js';

export class UpdatePublicationTagDto extends PartialType(CreatePublicationTagDto) {}
