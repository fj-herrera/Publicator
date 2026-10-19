import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMetaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  status: string;

  @IsOptional()
  @IsInt()
  clientId?: number;
}
