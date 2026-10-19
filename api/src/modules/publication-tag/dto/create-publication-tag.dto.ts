import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePublicationTagDto {
    @IsInt()
    @IsNotEmpty()
    publicationId: number;

    @IsInt()
    @IsNotEmpty()
    tagId: number;
}
