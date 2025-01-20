"use client";

import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import { usePathname } from 'next/navigation';

const outfit = Outfit({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isExcludedPage = [
    '/meetings',
    '/dashboard',
    '/dashboard/meeting-type',
    '/dashboard/scheduled-meeting',
    '/dashboard/availability',
    '/dashboard/settings',
    '/create-meeting',
    '/create-business'
  ].includes(pathname);

  return (
    <html lang="en">
      <body className={outfit.className}>
        <div className="md:px-20">
          {!isExcludedPage && <Header />}
          {children}
        </div>
        {!isExcludedPage && <Footer />}
      </body>
    </html>
  );
}