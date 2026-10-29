import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt } from 'class-validator';

export class ReorderCollectionsDto {
    @IsInt()
    publicationId: number;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsInt({ each: true })
    ids: number[];
}
