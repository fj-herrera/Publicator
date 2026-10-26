import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicationSkillGroupDto } from './create-publication-skill-group.dto.js';

export class UpdatePublicationSkillGroupDto extends PartialType(CreatePublicationSkillGroupDto) {}