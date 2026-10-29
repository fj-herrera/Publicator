import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt } from 'class-validator';

export class ReorderAssetCollectionsDto {
    @IsInt()
    collectionId: number;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsInt({ each: true })
    ids: number[];
}
