import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillGroupDto } from './create-skill-group.dto.js';

export class UpdateSkillGroupDto extends PartialType(CreateSkillGroupDto) {}
