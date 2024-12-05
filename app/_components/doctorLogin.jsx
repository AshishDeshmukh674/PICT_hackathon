"use client";
import { useState } from "react";
import axios from "axios";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { LoginLink, LogoutLink, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation"; // Ensure this is imported

export default function DoctorLogin() {
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const { user } = useKindeBrowserClient();
  const router = useRouter();  // Initialize router here

  const handleLogin = async () => {
    if (!doctorEmail || !doctorPassword) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      console.log("Attempting login with:", { doctorEmail, doctorPassword }); // Debugging
      const response = await axios.get(
        `http://localhost:1337/api/doctor-logins`,
        { params: { "filters[DoctorEmail][$eq]": doctorEmail } }
      );

      console.log("Response received:", response.data); // Debugging API response

      if (response.data.data.length > 0) {
        const doctor = response.data.data[0].attributes;

        if (doctor.Password === doctorPassword) {
          alert("Login successful!");
          router.push("/doctor_ui");  // Redirect to doctor UI

          // Fallback if redirection fails
          setTimeout(() => {
            alert("Redirecting failed. Please manually navigate to the dashboard.");
          }, 3000);
        } else {
          alert("Incorrect password. Please try again.");
        }
      } else {
        alert("Doctor not found. Please sign up.");
      }
    } catch (error) {
      console.error("Error during login:", error); // Log the error for debugging
      if (error.response) {
        // If the error comes from the server (API response)
        console.error("Error response:", error.response);
        alert(
          `Server responded with status: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        // If the error is related to the network or no response received
        console.error("Error request:", error.request);
        alert("Network error or no response from server. Please try again.");
      } else {
        // Other errors
        console.error("Error message:", error.message);
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
                <Button className="w-full bg-red-500 hover:bg-red-600">Logout</Button>
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
              />
              <Input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Name"
                required
              />
              <Input
                value={doctorPassword}
                onChange={(e) => setDoctorPassword(e.target.value)}
                type="password"
                placeholder="Enter password"
                required
              />
              <Button className="w-full bg-primary text-white hover:bg-primary-dark" onClick={handleLogin}>
                Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
