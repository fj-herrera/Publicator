import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicationSkillsDto } from './create-publication-skills.dto.js';

export class UpdatePublicationSkillsDto extends PartialType(CreatePublicationSkillsDto) {}