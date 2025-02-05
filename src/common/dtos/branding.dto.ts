import { ApiProperty } from "@nestjs/swagger";
import { IsHexColor, IsIn, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdateBrandingDto {
  @ApiProperty()
  @IsString()
  @IsUrl()
  @IsOptional()
  logo?: string;

  @ApiProperty()
  @IsString()
  @IsUrl()
  @IsOptional()
  backgroundImage?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn(["light", "dark"])
  theme?: "light" | "dark";

  @ApiProperty()
  @IsString()
  @IsOptional()
  header?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subHeader?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  buttonText?: string;

  @ApiProperty()
  @IsString()
  @IsHexColor()
  @IsOptional()
  primaryColor?: string;
}
