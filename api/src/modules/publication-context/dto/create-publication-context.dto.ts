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
    publicationId: number;

    @IsInt()
    @IsNotEmpty()
    contextId: number;
}
