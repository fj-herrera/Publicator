import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateSkillsDto {
    @IsInt()
    @IsNotEmpty()
    publication_id: number;
}