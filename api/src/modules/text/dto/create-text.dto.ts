import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { TextFormat } from '../entities/text.entity.js';

export class CreateTextDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsIn(['PLAIN', 'MD'])
    format: TextFormat;
}
