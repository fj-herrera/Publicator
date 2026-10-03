import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCollectionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    type: string;

    @IsInt()
    @IsNotEmpty()
    publication_id: number;
}
