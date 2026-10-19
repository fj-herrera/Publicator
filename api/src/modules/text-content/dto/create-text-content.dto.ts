import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateTextContentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    type: string;

    @IsInt()
    @IsNotEmpty()
    contentId: number;

    @IsOptional()
    @IsInt()
    textId?: number;
}
