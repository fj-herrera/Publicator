import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillGroupSkillDto } from './create-skill-group-skill.dto.js';

export class UpdateSkillGroupSkillDto extends PartialType(CreateSkillGroupSkillDto) {}