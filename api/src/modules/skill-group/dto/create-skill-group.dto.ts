import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateSkillGroupDto {
    @IsInt()
    @IsNotEmpty()
    publicationSkillsId: number;

    @IsInt()
    @IsNotEmpty()
    skillId: number;
}
