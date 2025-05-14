// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/firebase/client";

const protectedRoutes = ["/dashboard", "/profile"];
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const session = await auth.currentUser;
  const path = request.nextUrl.pathname;

  // Si no hay sesión y está en ruta protegida
  if (!session && protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si hay sesión y está en ruta de autenticación
  if (session && authRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};