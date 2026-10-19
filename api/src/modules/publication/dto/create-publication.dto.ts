import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePublicationDto {
    @IsInt()
    @IsNotEmpty()
    typeId: number;

    @IsInt()
    @IsNotEmpty()
    metaId: number;
}
