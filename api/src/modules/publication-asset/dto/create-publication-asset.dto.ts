import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePublicationAssetDto {
  @IsInt()
  @IsNotEmpty()
  publicationId: number;

  @IsInt()
  @IsNotEmpty()
  assetId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  role: string;
}