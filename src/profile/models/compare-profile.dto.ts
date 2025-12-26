import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CompareProfileDto {
  @IsString()
  @IsNotEmpty()
  firstProfile: string;

  @IsString()
  @IsNotEmpty()
  secondProfile: string;

  @IsBoolean()
  @IsOptional()
  advanced: boolean = false;

  @IsBoolean()
  @IsOptional()
  saveResults: boolean = false;
}
