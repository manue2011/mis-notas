import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  isSignupInviteUsable,
  SIGNUP_COOKIE,
  SIGNUP_COOKIE_MAX_AGE,
} from "@/lib/auth/signup-invite";

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

// The link the superadmin shares. Stores the token in an httpOnly cookie and
// moves on to /registro, so the token leaves the address bar and is sent along
// with the sign-up request, including the Google round trip.
export async function GET(request: NextRequest, ctx: RouteContext<"/invitacion/[token]">) {
  const { token } = await ctx.params;
  const parsed = tokenSchema.safeParse(token);
  const valid = parsed.success && (await isSignupInviteUsable(parsed.data));

  const target = new URL(valid ? "/registro" : "/registro?enlace=invalido", request.url);
  const response = NextResponse.redirect(target, 303);
  if (valid) {
    response.cookies.set(SIGNUP_COOKIE, parsed.data, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SIGNUP_COOKIE_MAX_AGE,
    });
  }
  return response;
}
