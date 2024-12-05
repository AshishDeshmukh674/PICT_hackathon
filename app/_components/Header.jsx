"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../../components/ui/button";
import { LoginLink, LogoutLink, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { AiOutlineArrowRight, AiOutlineArrowLeft } from "react-icons/ai";
import GlobalApi from "../../app/_utils/GlobalApi";

function Header() {
  const [campaigns, setCampaigns] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState("left");
  const animationDuration = 1000; // 1 second for each slide transition
  const { user } = useKindeBrowserClient();
  const pathname = usePathname();

  return (
    <header className="bg-white p-4 flex flex-col items-center justify-between">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-20">
          <div className="flex flex-col items-center">
            <Image src="/logo.png" alt="logo" width={150} height={70} />
            <span className="text-red-600 text-md font-semibold mt-2">Ratnamukund HealthCare Foundation</span>
          </div>

          <nav className="hidden md:flex space-x-6 gap-10">
            {[
              { id: 1, name: "Home", path: "/" },
              { id: 2, name: "Explore", path: "/#category-search" },
              { id: 3, name: "Contact", path: "/#Contact-us" },
            ].map((item) => (
              <Link
                href={item.path}
                key={item.id}
                className="text-gray-800 hover:text-primary transition duration-300 ease-in-out text-lg font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Popover>
              <PopoverTrigger>
                <Image
                  src={user?.picture}
                  alt="profile"
                  height={40}
                  width={40}
                  className="rounded-full cursor-pointer hover:opacity-80 transition duration-300 ease-in-out"
                />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 bg-white border border-gray-200 shadow-lg rounded-md">
                <ul className="flex flex-col gap-2">
                  <li className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out">
                    <Link href="/my-booking">My Booking</Link>
                  </li>
                  <li className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out">
                    <LogoutLink>Log Out</LogoutLink>
                  </li>
                </ul>
              </PopoverContent>
            </Popover>
          ) : (
            <LoginLink>
              <Button className="bg-primary text-white hover:bg-primary-dark transition duration-300 ease-in-out">
                Login
              </Button>
            </LoginLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
