import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateClientDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;
}
