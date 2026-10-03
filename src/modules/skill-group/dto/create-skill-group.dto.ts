import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateSkillGroupDto {
    @IsInt()
    @IsNotEmpty()
    skills_id: number;

    @IsInt()
    @IsNotEmpty()
    skill_id: number;
}
