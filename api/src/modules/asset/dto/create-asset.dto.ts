import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateAssetDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    type: string;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsOptional()
    @IsInt()
    dimensionsId?: number;
}
