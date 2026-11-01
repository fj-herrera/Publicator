import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { TextFormat } from '../../text/entities/text.entity.js';

export class UpdatePublicationTextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsIn(['PLAIN', 'MD'])
  format: TextFormat;
}
