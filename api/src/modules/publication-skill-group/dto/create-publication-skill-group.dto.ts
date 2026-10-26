import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePublicationSkillGroupDto {
  @IsInt()
  @IsNotEmpty()
  publicationId: number;

  @IsInt()
  @IsNotEmpty()
  skillGroupId: number;
}