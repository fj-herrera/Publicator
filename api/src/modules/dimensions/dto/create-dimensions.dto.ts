import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateDimensionsDto {
  @IsInt()
  width: number;

  @IsInt()
  height: number;
}
