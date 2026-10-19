import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePublicationSkillsDto {
  @IsInt()
  @IsNotEmpty()
  publicationId: number;
}