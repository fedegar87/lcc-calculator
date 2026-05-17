import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";
import { prisma } from "./prisma";

// Dev-only safety net: accept localhost on the common ports so a dev
// server that falls back from :3000 to :3001 / :3002 (because the
// primary port is held by an orphan process) does not 401 with
// "Invalid origin". Production keeps trustedOrigins undefined so
// Better Auth uses BETTER_AUTH_URL only.
const trustedOrigins =
  process.env.NODE_ENV === "production"
    ? undefined
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
      ];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins,
  plugins: [
    anonymous({
      generateName: () => "Guest",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
