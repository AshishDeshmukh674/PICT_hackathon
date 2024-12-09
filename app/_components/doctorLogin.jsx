"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { LoginLink, LogoutLink, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";

export default function DoctorLogin() {
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const { user } = useKindeBrowserClient();
  const router = useRouter();

  const handleLogin = async () => {
    if (!doctorEmail || !doctorPassword) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const response = await axios.get(`http://localhost:1337/api/doctor-logins`, {
        params: { "filters[DoctorEmail][$eq]": doctorEmail },
      });

      if (response.data.data.length > 0) {
        const doctor = response.data.data[0].attributes;

        if (doctor.Password === doctorPassword) {
          alert("Login successful!");
          router.push("/doctor_ui");
        } else {
          alert("Incorrect password. Please try again.");
        }
      } else {
        alert("Doctor not found. Please sign up.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      if (error.response) {
        alert(`Server error: ${error.response.statusText}. Please try again later.`);
      } else if (error.request) {
        alert("Network error: Unable to reach the server. Please check your connection.");
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Doctor Login</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="text-center">
              <p className="mb-4 text-gray-700">Welcome back, {user.name || user.email}!</p>
              <LogoutLink>
                <Button className="w-full bg-red-500 hover:bg-red-600" aria-label="Logout">
                  Logout
                </Button>
              </LogoutLink>
            </div>
          ) : (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <Input
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                type="email"
                placeholder="Email"
                required
                aria-label="Email"
              />
              <Input
                value={doctorPassword}
                onChange={(e) => setDoctorPassword(e.target.value)}
                type="password"
                placeholder="Password"
                required
                aria-label="Password"
              />
              <Button
                className="w-full bg-primary text-white hover:bg-primary-dark"
                onClick={handleLogin}
                aria-label="Login"
              >
                Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
