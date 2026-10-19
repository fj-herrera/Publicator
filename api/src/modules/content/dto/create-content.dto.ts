import { IsInt, IsOptional } from 'class-validator';

export class CreateContentDto {
    @IsOptional()
    @IsInt()
    publicationId?: number;
}
