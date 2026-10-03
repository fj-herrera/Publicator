import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePublicationAssetDto {
  @IsInt()
  @IsNotEmpty()
  publication_id: number;

  @IsInt()
  @IsNotEmpty()
  asset_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  role: string;
}