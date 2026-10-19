import { PartialType } from '@nestjs/mapped-types';
import { CreateMetaDto } from './create-meta.dto.js';

export class UpdateMetaDto extends PartialType(CreateMetaDto) {}
