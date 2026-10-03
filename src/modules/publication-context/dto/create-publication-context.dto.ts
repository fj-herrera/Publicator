import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
} from 'class-validator';

export class CreatePublicationContextDto {
    @IsInt()
    @IsNotEmpty()
    position: number;

    @IsBoolean()
    @IsNotEmpty()
    visible: boolean;

    @IsBoolean()
    @IsNotEmpty()
    featured: boolean;

    @IsInt()
    @IsNotEmpty()
    publication_id: number;

    @IsInt()
    @IsNotEmpty()
    context_id: number;
}
