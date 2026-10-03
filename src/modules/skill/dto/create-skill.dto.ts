import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSkillDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    icon?: string | null;
}

