import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // const url = request.nextUrl.clone();
  // const token =
  //   request.nextUrl.searchParams.get("token") ||
  //   request.cookies.get("admin_token")?.value;
  // const alreadyValidated =
  //   request.cookies.get("admin_token_validated")?.value === "true";
  // if (!token) {
  //   if (!alreadyValidated) {
  //     return NextResponse.redirect(new URL("/error/unauthorized", request.url));
  //   }
  //   return NextResponse.next();
  // }
  // if (!alreadyValidated) {
  //   try {
  //     const res = await fetch(
  //       "https://angers-poker-club.fr/wp-json/custom/validate-token",
  //       {
  //         headers: { Authorization: `Bearer ${token}` }
  //       }
  //     );
  //     if (!res.ok) {
  //       console.log("Token rejected, redirecting to unauthorized.");
  //       return NextResponse.redirect(
  //         new URL("/error/unauthorized", request.url)
  //       );
  //     }
  //     console.log("Token validated successfully.");
  //     const response = NextResponse.next();
  //     response.cookies.set("admin_token", token, {
  //       httpOnly: true,
  //       secure: true,
  //       path: "/"
  //     });
  //     response.cookies.set("admin_token_validated", "true", {
  //       path: "/",
  //       secure: true,
  //       maxAge: 60 * 60
  //     });
  //     return response;
  //   } catch (err) {
  //     console.error("Token validation failed:", err);
  //     return NextResponse.redirect(new URL("/error/unauthorized", request.url));
  //   }
  // }
  // return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|error/unauthorized|api/sync-wordpress-tournament|api/public/).*)"
  ]
};
