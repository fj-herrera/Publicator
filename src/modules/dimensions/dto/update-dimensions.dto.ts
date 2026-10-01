import { PartialType } from '@nestjs/mapped-types';
import { CreateDimensionsDto } from './create-dimensions.dto.js';

export class UpdateDimensionsDto extends PartialType(CreateDimensionsDto) {}
