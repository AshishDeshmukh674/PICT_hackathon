// "use client";
// import React, { useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { Button } from "../../components/ui/button";
// import { LoginLink, LogoutLink, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
// import { Popover, PopoverTrigger, PopoverContent } from "../../components/ui/popover";

// function Header() {
//   const { user } = useKindeBrowserClient(); // User information from Kinde
//   const [userType, setUserType] = useState(null); // Track if the user is "patient" or "doctor"

//   const handleDoctorLogin = () => {
//     setUserType("doctor");
//     window.location.href = "/doctor_login"; // Redirect to doctor login page
//   };

//   const handlePatientLogin = () => {
//     setUserType("patient");
//     // Patient login handled by LoginLink logic
//   };

//   return (
//     <header className="bg-white p-4 flex flex-col items-center justify-between">
//       <div className="flex items-center justify-between w-full">
//         <div className="flex items-center gap-20">
//           <div className="flex flex-col items-center">
//             <Image src="/logo.png" alt="logo" width={150} height={70} />
//             <span className="text-red-600 text-md font-semibold mt-2">Ratnamukund HealthCare Foundation</span>
//           </div>

//           <nav className="hidden md:flex space-x-6 gap-10">
//             {[
//               { id: 1, name: "Home", path: "/" },
//               { id: 2, name: "Explore", path: "/#category-search" },
//               { id: 3, name: "Contact", path: "/#Contact-us" },
//             ].map((item) => (
//               <Link
//                 href={item.path}
//                 key={item.id}
//                 className="text-gray-800 hover:text-primary transition duration-300 ease-in-out text-lg font-medium"
//               >
//                 {item.name}
//               </Link>
//             ))}
//           </nav>
//         </div>

//         <div className="flex items-center gap-4">
//           {user ? (
//             <Popover>
//               <PopoverTrigger>
//                 <Image
//                   src={user?.picture}
//                   alt="profile"
//                   height={40}
//                   width={40}
//                   className="rounded-full cursor-pointer hover:opacity-80 transition duration-300 ease-in-out"
//                 />
//               </PopoverTrigger>
//               <PopoverContent className="w-48 p-2 bg-white border border-gray-200 shadow-lg rounded-md">
//                 <ul className="flex flex-col gap-2">
//                   {userType === "patient" && (
//                     <li className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out">
//                       <Link href="/my-booking">My Booking</Link>
//                     </li>
//                   )}
//                   <li className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out">
//                     <LogoutLink>Log Out</LogoutLink>
//                   </li>
//                 </ul>
//               </PopoverContent>
//             </Popover>
//           ) : (
//             <Popover>
//               <PopoverTrigger>
//                 <Button className="bg-primary text-white hover:bg-primary-dark transition duration-300 ease-in-out">
//                   Login
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-48 p-2 bg-white border border-gray-200 shadow-lg rounded-md">
//                 <ul className="flex flex-col gap-2">
//                   <li
//                     className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out"
//                     onClick={handlePatientLogin}
//                   >
//                     <LoginLink>Login as Patient</LoginLink>
//                   </li>
//                   <li
//                     className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out"
//                     onClick={handleDoctorLogin}
//                   >
//                     Login as Doctor
//                   </li>
//                 </ul>
//               </PopoverContent>
//             </Popover>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }

// export default Header;
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { LoginLink, LogoutLink, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Popover, PopoverTrigger, PopoverContent } from "../../components/ui/popover";

function Header() {
  const { user } = useKindeBrowserClient();
  const [userType, setUserType] = useState(null); // Track user type: "patient", "doctor", or null
  const router = useRouter();

  // Check localStorage to determine if a doctor is logged in
  useEffect(() => {
    const loggedDoctor = localStorage.getItem("loggedDoctor");
    if (loggedDoctor) {
      setUserType("doctor");
    }
  }, []);

  const handleDoctorLogout = () => {
    localStorage.removeItem("loggedDoctor"); // Clear doctor's login state
    setUserType(null);
    router.push("/"); // Redirect to home page
  };

  return (
    <header className="bg-white p-4 flex flex-col items-center justify-between">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-20">
          <div className="flex flex-col items-center">
            <Image src="/logo.png" alt="logo" width={150} height={70} />
            {/* <span className="text-red-600 text-md font-semibold mt-2">Ratnamukund HealthCare Foundation</span> */}
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
          {userType === "doctor" ? (
            <Button
              onClick={handleDoctorLogout}
              className="bg-red-500 text-white hover:bg-red-600 transition duration-300 ease-in-out"
            >
              Logout
            </Button>
          ) : user ? (
            <Popover>
              <PopoverTrigger>
                <Image
                  src={user?.picture || "/default-profile.png"}
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
                    <Link href="/diet-planner">Diet Planner</Link>
                  </li>
                  <li className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out">
                    <LogoutLink>Log Out</LogoutLink>
                  </li>
                </ul>
              </PopoverContent>
            </Popover>
          ) : (
            <Popover>
              <PopoverTrigger>
                <Button className="bg-primary text-white hover:bg-primary-dark transition duration-300 ease-in-out">
                  Login
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 bg-white border border-gray-200 shadow-lg rounded-md">
                <ul className="flex flex-col gap-2">
                  <li className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out">
                    <LoginLink>Login as Patient</LoginLink>
                  </li>
                  <li
                    className="cursor-pointer hover:bg-gray-100 p-2 rounded-md text-gray-800 hover:text-primary transition duration-300 ease-in-out"
                    onClick={() => router.push("/doctor_login")}
                  >
                    Login as Doctor
                  </li>
                </ul>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

