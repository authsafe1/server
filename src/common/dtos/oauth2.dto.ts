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
  @IsEmail()
  @IsString()
  email: string;

  @MinLength(6)
  @IsString()
  password: string;
}

export class OAuth2AuthorizeQuery {
  @IsString()
  @IsUUID()
  client_id: string;

  @IsString()
  @IsUUID()
  organization_id: string;

  @IsString()
  @IsUrl()
  redirect_uri: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(["code", "token"], {
    message: "Unsupported response type",
  })
  response_type: string;

  @IsArray()
  @Transform(params => params.value.split(" "))
  scope: string[];

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  nonce?: string;
}

export class OAuth2TokenDto {
  @IsString()
  @IsIn(["authorization_code", "client_credentials", "refresh_token"], {
    message: "Unsupported grant type",
  })
  grant_type: "authorization_code" | "client_credentials" | "refresh_token";

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  refresh_token?: string;

  @IsUrl()
  @IsString()
  redirect_uri: string;

  @IsUUID()
  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;
}
