import { PartialType } from '@nestjs/mapped-types';
import { CreateContextDto } from './create-context.dto.js';

export class UpdateContextDto extends PartialType(CreateContextDto) {}
