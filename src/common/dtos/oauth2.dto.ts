import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MinLength,
} from "class-validator";

export class OAuth2AuthorizeDto {
  @ApiProperty()
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty()
  @MinLength(6)
  @IsString()
  password: string;
}

export class OAuth2AuthorizeQuery {
  @ApiProperty()
  @IsString()
  @IsUUID()
  client_id: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  organization_id: string;

  @ApiProperty()
  @IsString()
  @IsUrl()
  redirect_uri: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(["code", "token"], {
    message: "Unsupported response type",
  })
  response_type: string;

  @ApiProperty()
  @IsArray()
  @Transform(params => params.value.split(" "))
  @IsIn(["openid", "profile", "roles", "permissions"], {
    message: "Unknown scope",
  })
  scope: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  nonce?: string;
}

export class OAuth2TokenDto {
  @ApiProperty()
  @IsString()
  @IsIn(["authorization_code", "client_credentials", "refresh_token"], {
    message: "Unsupported grant type",
  })
  grant_type: "authorization_code" | "client_credentials" | "refresh_token";

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  refresh_token?: string;

  @ApiProperty()
  @IsUrl()
  @IsString()
  redirect_uri: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  client_id: string;

  @ApiProperty()
  @IsString()
  client_secret: string;
}
