import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePublicationTagDto {
    @IsInt()
    @IsNotEmpty()
    publication_id: number;

    @IsInt()
    @IsNotEmpty()
    tag_id: number;
}
