import { IsString, IsNotEmpty } from 'class-validator';

export class CompareProfileDto {
  @IsString()
  @IsNotEmpty()
  firstProfile: string;

  @IsString()
  @IsNotEmpty()
  secondProfile: string;
}
