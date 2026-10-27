import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Min,
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
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(127)
    mimeType?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    sizeBytes?: number;

    @IsOptional()
    @IsInt()
    dimensionsId?: number;
}
