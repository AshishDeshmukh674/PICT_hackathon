"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { ChevronLeft } from "lucide-react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import LocationOption from "../../../../app/_utils/LocationOption";
import Image from "next/image";
import Link from "next/link";
import ThemeOptions from "../../../../app/_utils/ThemeOptions";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { app } from "../../../config/FirebaseConfig";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import GoogleMeetButton from "./GoogleMeetButton";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const ZOOM_CLIENT_ID = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
const ZOOM_REDIRECT_URI =
  process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URI ||
  "http://localhost:3000/create-meeting";

const loadGoogleApi = () => {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      window.gapi.load("client:auth2", () => {
        resolve();
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.gapi.load("client:auth2", () => {
        resolve();
      });
    };
    script.onerror = (error) => {
      console.error("Error loading Google API:", error);
      reject(error);
    };
    document.body.appendChild(script);
  });
};

function MeetingForm({ setFormValue }) {
  const [location, setLocation] = useState();
  const [themeColor, setThemeColor] = useState("");
  const [eventName, setEventName] = useState("");
  const [duration, setDuration] = useState(30);
  const [locationType, setLocationType] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const { user } = useKindeBrowserClient();
  const db = getFirestore(app);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [locationInputUrl, setLocationInputUrl] = useState("");

  const locationTypes = [
    {
      type: "Zoom",
      description: "Create a video meeting with Zoom",
    },
    {
      type: "Phone",
      description: "Share your phone number for a call",
    },
    {
      type: "Other",
      description: "Add a custom meeting location",
    },
  ];

  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    // Only load Zoom auth token, clear other meeting details
    const zoomToken = localStorage.getItem("zoomAccessToken");

    // Check for Zoom authorization code only once
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    if (authCode && !zoomToken) {
      handleZoomAuth(authCode);
    }
  }, []); // Empty dependency array to run only once

  // Update the effect to sync with localStorage
  useEffect(() => {
    if (!isBrowser) return;

    const formData = {
      eventName,
      duration,
      locationType,
      locationUrl,
      themeColor,
      selectedDate: localStorage.getItem("selectedDate"),
      selectedTime: localStorage.getItem("selectedTime"),
    };

    // Save to localStorage
    Object.entries(formData).forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value);
    });

    // Update parent state
    setFormValue(formData);

    // Debug log
    console.log("Form data updated:", formData);
  }, [
    eventName,
    duration,
    locationType,
    locationUrl,
    themeColor,
    setFormValue,
  ]);

  const clearMeetingDetails = () => {
    if (!isBrowser) return;

    // Clear all meeting-specific details but keep auth tokens
    const zoomToken = localStorage.getItem("zoomAccessToken");
    localStorage.clear();
    if (zoomToken) {
      localStorage.setItem("zoomAccessToken", zoomToken);
    }

    // Reset state
    setEventName("");
    setDuration(30);
    setLocationType("");
    setLocationUrl("");
    setThemeColor("");
  };

  const handleZoomAuth = async (authCode) => {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);

      const response = await axios.post("/api/zoom/token", {
        code: authCode,
      });

      if (response.data.access_token) {
        localStorage.setItem("zoomAccessToken", response.data.access_token);
        localStorage.setItem("zoomRefreshToken", response.data.refresh_token);
        await createZoomMeeting(response.data.access_token);
      } else {
        throw new Error(response.data.error || "Failed to get access token");
      }
    } catch (error) {
      console.error("Zoom authorization error:", error);
      toast.error("Failed to authorize with Zoom");
    }
  };

  const handleLocationUrl = async (type) => {
    setLocationType(type);
    localStorage.setItem("locationType", type);

    try {
      switch (type) {
        case "Zoom":
          const accessToken = localStorage.getItem("zoomAccessToken");
          if (accessToken) {
            // If we have a token, try to create meeting
            const url = await createZoomMeeting(accessToken);
            if (url) {
              setLocationUrl(url);
              setLocationInputUrl(url);
              localStorage.setItem("locationUrl", url);
              setFormValue((prev) => ({ ...prev, locationUrl: url }));
            }
          } else {
            // If no token, initiate Zoom authorization
            initiateZoomAuth();
          }
          break;

        case "Phone":
          const phoneNumber = "+1-555-0123";
          setLocationUrl(phoneNumber);
          localStorage.setItem("locationUrl", phoneNumber);
          setFormValue((prev) => ({ ...prev, locationUrl: phoneNumber }));
          break;

        case "Other":
          setLocationUrl("");
          localStorage.removeItem("locationUrl");
          setFormValue((prev) => ({ ...prev, locationUrl: "" }));
          break;
      }
    } catch (error) {
      console.error("Error handling location:", error);
      toast.error(`Failed to set up ${type} meeting`);
    }
  };

  const initiateZoomAuth = () => {
    // Generate and store state parameter for security
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem("zoom_auth_state", state);

    // Construct Zoom OAuth URL
    const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      ZOOM_REDIRECT_URI
    )}&state=${state}`;

    // Redirect to Zoom authorization page
    window.location.href = zoomAuthUrl;
  };

  // Add this useEffect to handle Zoom authorization callback
  useEffect(() => {
    const handleZoomCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const storedState = localStorage.getItem("zoom_auth_state");

      if (code && state && state === storedState) {
        // Clear the state from storage
        localStorage.removeItem("zoom_auth_state");

        // Clear URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Handle the authorization code
        await handleZoomAuth(code);
      }
    };

    handleZoomCallback();
  }, []);

  const createZoomMeeting = async (accessToken) => {
    try {
      const response = await axios.post("/api/zoom/create-meeting", {
        accessToken,
        meetingData: {
          topic: eventName || "New Meeting",
          duration: duration,
          type: 2,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
          },
        },
      });

      if (response.data.join_url) {
        setLocationUrl(response.data.join_url);
        setLocationInputUrl(response.data.join_url);
        localStorage.setItem("locationUrl", response.data.join_url);
        setFormValue((prev) => ({
          ...prev,
          locationUrl: response.data.join_url,
        }));
        return response.data.join_url;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        try {
          const refreshToken = localStorage.getItem("zoomRefreshToken");
          const refreshResponse = await axios.post("/api/zoom/refresh-token", {
            refresh_token: refreshToken,
          });

          if (refreshResponse.data.access_token) {
            localStorage.setItem(
              "zoomAccessToken",
              refreshResponse.data.access_token
            );
            localStorage.setItem(
              "zoomRefreshToken",
              refreshResponse.data.refresh_token
            );
            // Retry the meeting creation with new token
            return createZoomMeeting(refreshResponse.data.access_token);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          toast.error("Session expired. Please reconnect with Zoom");
          initiateZoomAuth();
        }
      } else {
        console.error("Error creating Zoom meeting:", error);
        toast.error("Failed to create Zoom meeting");
      }
    }
  };

  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        // Load Google Calendar API
        await new Promise((resolve) => gapi.load("client:auth2", resolve));
        await gapi.client.init({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
          clientId: GOOGLE_CLIENT_ID,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
          scope: "https://www.googleapis.com/auth/calendar",
        });
      } catch (error) {
        console.error("Error initializing Google APIs:", error);
        toast.error("Failed to initialize Google Meet");
      }
    };

    if (typeof window !== "undefined" && window.google && window.gapi) {
      initializeGoogleAuth();
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      if (response.credential) {
        localStorage.setItem("googleToken", response.credential);
        await createGoogleMeetLink();
      }
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error("Failed to authenticate with Google");
    }
  };

  const createGoogleMeetLink = async () => {
    try {
      const token = localStorage.getItem("googleToken");
      if (!token) {
        window.google.accounts.id.prompt();
        return;
      }

      const event = {
        summary: eventName || "New Meeting",
        description: `Duration: ${duration} minutes`,
        start: {
          dateTime: selectedDate
            ? new Date(selectedDate).toISOString()
            : new Date().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: selectedDate
            ? new Date(
                new Date(selectedDate).getTime() + duration * 60000
              ).toISOString()
            : new Date(Date.now() + duration * 60000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}_${Math.random()
              .toString(36)
              .substring(7)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      };

      const response = await gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: event,
        conferenceDataVersion: 1,
      });

      if (response.result.hangoutLink) {
        setLocationUrl(response.result.hangoutLink);
        localStorage.setItem("locationUrl", response.result.hangoutLink);
        setFormValue((prev) => ({
          ...prev,
          locationUrl: response.result.hangoutLink,
        }));
      }
    } catch (error) {
      console.error("Error creating Google Meet:", error);
      toast.error("Failed to create Google Meet link");
    }
  };

  const handleMeetLinkGenerated = (meetLink) => {
    setLocationUrl(meetLink);
    localStorage.setItem("locationUrl", meetLink);
    setFormValue((prev) => ({ ...prev, locationUrl: meetLink }));
  };

  // Update the isFormValid function to not require themeColor
  const isFormValid = () => {
    const requiredFields = {
      eventName: !!eventName?.trim(),
      duration: !!duration,
      locationType: !!locationType,
      locationUrl: !!locationUrl?.trim(),
      selectedDate: isBrowser ? !!localStorage.getItem("selectedDate") : false,
      selectedTime: isBrowser ? !!localStorage.getItem("selectedTime") : false,
    };

    // Log validation status for debugging
    console.log("Form validation:", requiredFields);

    return Object.values(requiredFields).every((field) => field === true);
  };

  const onCreateClick = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const id = Date.now().toString();
      await setDoc(doc(db, "MeetingEvent", id), {
        id: id,
        eventName: eventName,
        duration: duration,
        locationType: locationType,
        locationUrl: locationUrl,
        themeColor: themeColor,
        selectedDate: selectedDate,
        selectedTime: selectedTime,
        businessId: doc(db, "Business", user?.email),
        createdBy: user?.email,
        createdAt: new Date().toISOString(),
      });

      toast.success("New Meeting Event Created!");
      clearMeetingDetails();
      router.replace("/dashboard/meeting-type");
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 flex-1">
        <div>
          <Link href={"/dashboard"} onClick={clearMeetingDetails}>
            <h2 className="flex gap-2 items-center text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4" /> Cancel
            </h2>
          </Link>
          <div className="mt-4">
            <h2 className="font-bold text-2xl my-4">Create New Event</h2>
            <hr className="border-gray-200" />
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-6">
          <div>
            <h2 className="font-bold mb-2">Event Name *</h2>
            <Input
              placeholder="Name of your meeting event"
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
            />
          </div>

          <div>
            <h2 className="font-bold mb-2">Duration *</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="max-w-40">
                  {duration} Min
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setDuration(15)}>
                  15 Min
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDuration(30)}>
                  30 Min
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDuration(45)}>
                  45 Min
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDuration(60)}>
                  60 Min
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <h2 className="font-bold mb-2">Location *</h2>
            <div className="grid grid-cols-4 gap-3">
              {LocationOption.map((option, index) => (
                <div
                  key={index}
                  className={`border flex flex-col justify-center items-center p-3 rounded-lg cursor-pointer hover:bg-blue-100 hover:border-primary ${
                    locationType === option.name && "bg-blue-100 border-primary"
                  }`}
                  onClick={() => {
                    setLocationType(option.name);
                    handleLocationUrl(option.name);
                  }}
                >
                  <Image
                    src={option.icon}
                    width={30}
                    height={30}
                    alt={option.name}
                  />
                  <h2>{option.name}</h2>
                </div>
              ))}
            </div>
          </div>

          {locationType && locationType !== "Phone" && (
            <>
              <div>
                <h2 className="font-bold mb-2">Add {locationType} URL *</h2>
                <Input
                  placeholder={`Generated ${locationType} URL`}
                  value={locationInputUrl || ""}
                  readOnly
                />
              </div>
            </>
          )}
          {locationType === "Phone" && (
            <>
              <div>
                <h2 className="font-bold mb-2">Phone Number *</h2>
                <Input
                  placeholder="Generated Phone Number"
                  value={locationUrl}
                  readOnly
                />
              </div>
            </>
          )}

          <div>
            <h2 className="font-bold mb-2">Select Theme Color</h2>
            <div className="flex justify-evenly">
              {ThemeOptions.map((color, index) => (
                <div
                  key={index}
                  className={`h-7 w-7 rounded-full ${
                    themeColor === color && " border-4 border-black"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setThemeColor(color)}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 pt-0 mt-auto">
        <Button
          className="w-full"
          disabled={!isFormValid()}
          onClick={onCreateClick}
        >
          Create
        </Button>
      </div>
    </div>
  );
}

export default MeetingForm;
