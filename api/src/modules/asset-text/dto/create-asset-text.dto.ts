import {
    IsInt,
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateAssetTextDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    type: string;

    @IsInt()
    @IsNotEmpty()
    assetId: number;

    @IsInt()
    @IsNotEmpty()
    textId: number;
}