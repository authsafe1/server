import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
//import { OAuth2Strategy, VerifyFunction } from "passport-google-oauth";
import {
  Strategy as OAuth2Strategy,
  VerifyCallback,
} from "passport-google-oauth2";

@Injectable()
export class GoogleStrategy extends PassportStrategy(OAuth2Strategy, "google") {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.APP_URL}/auth/google/callback`,
      scope: ["openid", "email", "profile"],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;
    const user = {
      googleId: id,
      name: displayName,
      email: emails[0].value,
      photo: photos[0].value,
    };
    done(null, user);
  }
}
