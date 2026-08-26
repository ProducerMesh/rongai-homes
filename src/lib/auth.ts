import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// Phase 1 auth: Google OAuth + a lightweight credentials flow that stands in
// for phone/OTP login. Swap CredentialsProvider's authorize() for a real
// SMS/OTP provider (e.g. Africa's Talking, Twilio Verify) when ready —
// nothing else in the app needs to change.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone",
      credentials: {
        phone: { label: "Phone number", type: "text" },
        otp: { label: "One-time code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        // TODO(Phase 1 follow-up): verify the OTP against a real store
        // (Redis / DB with expiry) before enabling this in production.
        // For now this stub only finds-or-creates the user by phone once
        // an OTP service is wired in.
        const user = await prisma.user.upsert({
          where: { phone: credentials.phone },
          update: {},
          create: { phone: credentials.phone, role: "TENANT" },
        });

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "TENANT";
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.uid as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
