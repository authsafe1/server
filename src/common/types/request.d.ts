import { Client, Profile } from "@prisma/client";
import { OAuth2 } from "oauth2orize";

type PartialUser = Pick<Profile, "id" | "name" | "email">;

declare global {
  namespace Express {
    interface Request {
      user?: PartialUser;
      oauth2?: OAuth2<Client, User>;
    }
  }
}
