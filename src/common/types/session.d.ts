import { Secret } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";
import "express-session";

declare module "express-session" {
  interface SessionData {
    organization: {
      id: string;
      name: string;
      domain: string;
      email: string;
      Secret: Pick<Secret, "privateKey" | "id">;
      metadata: JsonValue;
    };
    oauth2: {
      user: {
        id: string;
        name: string;
        email: string;
      };
    };
  }
}
