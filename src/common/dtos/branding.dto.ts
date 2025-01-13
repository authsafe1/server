import { IsHexColor, IsIn, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdateBrandingDto {
  @IsString()
  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  backgroundImage?: string;

  @IsString()
  @IsOptional()
  @IsIn(["light", "dark"])
  theme?: "light" | "dark";

  @IsString()
  @IsOptional()
  header?: string;

  @IsString()
  @IsOptional()
  subHeader?: string;

  @IsString()
  @IsOptional()
  buttonText?: string;

  @IsString()
  @IsHexColor()
  @IsOptional()
  primaryColor?: string;
}
