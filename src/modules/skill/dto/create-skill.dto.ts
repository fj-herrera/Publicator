import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSkillDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;
}

