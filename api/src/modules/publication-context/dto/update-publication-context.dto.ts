import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicationContextDto } from './create-publication-context.dto.js';

export class UpdatePublicationContextDto extends PartialType(CreatePublicationContextDto) {}
