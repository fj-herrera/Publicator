import {
    IsInt,
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateAssetCollectionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    role: string;

    @IsInt()
    @IsNotEmpty()
    collection_id: number;

    @IsInt()
    @IsNotEmpty()
    asset_id: number;
}