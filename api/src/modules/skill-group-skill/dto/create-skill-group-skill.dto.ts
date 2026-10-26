import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateSkillGroupSkillDto {
  @IsInt()
  @IsNotEmpty()
  skillGroupId: number;

  @IsInt()
  @IsNotEmpty()
  skillId: number;
}