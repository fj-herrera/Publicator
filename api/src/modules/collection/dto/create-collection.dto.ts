import { IsInt, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCollectionDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    type: string;

    @IsInt()
    @IsNotEmpty()
    publicationId: number;
}
