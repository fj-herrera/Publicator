import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePublicationDto {
    @IsInt()
    @IsNotEmpty()
    type_id: number;

    @IsInt()
    @IsNotEmpty()
    meta_id: number;
}
