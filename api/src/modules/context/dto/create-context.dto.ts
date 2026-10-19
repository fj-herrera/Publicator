import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateContextDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;
}
