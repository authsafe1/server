import { Client, Organization } from "@prisma/client";
import { OAuth2 } from "oauth2orize";

type PartialUser = Pick<Organization, "id" | "name" | "email" | "domain">;

declare global {
  namespace Express {
    interface Request {
      user?: PartialUser;
      oauth2?: OAuth2<Client, User>;
    }
  }
}
