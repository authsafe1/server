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

export class OAuth2Authorize {
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
  @IsNotEmpty()
  redirect_uri: string;

  @IsString()
  @IsNotEmpty()
  response_type: string;

  @IsArray()
  @IsOptional()
  @Transform(params => params.value.split(" "))
  scope?: string[];

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  nonce?: string;
}

export class OAuth2Token {
  @IsString()
  @IsIn(["client_credentials", "authorization_code"], {
    message: "Unsupported grant type",
  })
  grant_type: "client_credentials" | "authorization_code";

  @IsString()
  code: string;

  @IsUrl()
  @IsString()
  redirect_uri: string;

  @IsUUID()
  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;
}
