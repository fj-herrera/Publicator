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
    asset_id: number;

    @IsInt()
    @IsNotEmpty()
    text_id: number;
}