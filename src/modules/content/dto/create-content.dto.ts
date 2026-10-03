import { IsInt, IsOptional } from 'class-validator';

export class CreateContentDto {
    @IsOptional()
    @IsInt()
    publication_id?: number;
}
