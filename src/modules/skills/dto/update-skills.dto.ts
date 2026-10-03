import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillsDto } from './create-skills.dto.js';

export class UpdateSkillsDto extends PartialType(CreateSkillsDto) {}
