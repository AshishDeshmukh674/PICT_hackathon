import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

 
// This function can be marked `async` if using `await` inside
export async function middleware(request) {
    const { isAuthenticated } = getKindeServerSession();
    if (!(await isAuthenticated())) {
        const redirectUrl = new URL('/api/auth/login', request.url);
        redirectUrl.searchParams.set('post_login_redirect_url', '/dashboard');
        return NextResponse.redirect(redirectUrl);
    }
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard/:path*', '/create-business', '/meetings'],
}