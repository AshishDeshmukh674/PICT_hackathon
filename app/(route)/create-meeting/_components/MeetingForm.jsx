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
import locationTypes from "../../../../app/_utils/LocationOption";
import Link from "next/link";
import ThemeOptions from "../../../../app/_utils/ThemeOptions";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { app } from "../../../config/FirebaseConfig";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ZOOM_CLIENT_ID = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
const ZOOM_REDIRECT_URI =
  process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URI ||
  "http://localhost:3000/create-meeting";


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
  const [locationInputUrl, setLocationInputUrl] = useState("");
  const [doctorId, setDoctorId] = useState(null);


  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    // Only load Zoom auth token, clear other meeting details
    const zoomToken = localStorage.getItem("zoomAccessToken");

    // Check for Zoom authorization code only once
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get("code");
      const doctorId = urlParams.get("doctorId"); // Get doctorId from URL
      
      if (authCode && !zoomToken) {
        handleZoomAuth(authCode, doctorId); // Pass doctorId to handleZoomAuth
      }
    }
  }, []);

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

  // Add this useEffect to get doctorId from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('doctorId');
      if (id) {
        setDoctorId(id);
      }
    }
  }, []);

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
    localStorage.removeItem("clinicType"); // Clear clinic type
  };

  const handleZoomAuth = async (authCode, doctorId) => {
    try {
      // Preserve doctorId when clearing URL parameters
      const newUrl = doctorId 
        ? `/create-meeting?doctorId=${doctorId}`
        : '/create-meeting';
      window.history.replaceState({}, document.title, newUrl);

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
  };

  const initiateZoomAuth = () => {
    // Generate and store state parameter for security
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem("zoom_auth_state", state);

    // Get current doctorId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get("doctorId");

    // Store doctorId in localStorage to preserve it through auth flow
    if (doctorId) {
      localStorage.setItem("temp_doctor_id", doctorId);
    }

    // Construct Zoom OAuth URL
    const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      ZOOM_REDIRECT_URI
    )}&state=${state}`;

    // Redirect to Zoom authorization page
    window.location.href = zoomAuthUrl;
  };

  // Update the Zoom callback handler
  useEffect(() => {
    const handleZoomCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const storedState = localStorage.getItem("zoom_auth_state");
      const storedDoctorId = localStorage.getItem("temp_doctor_id"); // Get stored doctorId

      if (code && state && state === storedState) {
        // Clear the state from storage
        localStorage.removeItem("zoom_auth_state");
        localStorage.removeItem("temp_doctor_id"); // Clean up stored doctorId

        // Handle the authorization code with preserved doctorId
        await handleZoomAuth(code, storedDoctorId);
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

  // Update the isFormValid function
  const isFormValid = () => {
    const requiredFields = {
      eventName: !!eventName?.trim(),
      duration: !!duration,
      locationType: !!locationType,
      locationUrl: !!locationUrl?.trim(),
      selectedDate: !!localStorage.getItem("selectedDate"),
      selectedTime: !!localStorage.getItem("selectedTime"),
    };

    // Log validation status for debugging
    console.log("Form validation:", requiredFields);
    console.log("Selected Date:", localStorage.getItem("selectedDate"));
    console.log("Selected Time:", localStorage.getItem("selectedTime"));

    return Object.values(requiredFields).every((field) => field === true);
  };

  const onCreateClick = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const id = Date.now().toString();
      // Get the clinic slot type from localStorage
      const selectedDate = localStorage.getItem("selectedDate");
      const selectedTime = localStorage.getItem("selectedTime");
      const clinicSlot = localStorage.getItem("clinicType") || "Morning Clinic"; // Default to Morning Clinic if not set

      await setDoc(doc(db, "MeetingEvent", id), {
        id: id,
        eventName: eventName,
        duration: duration,
        locationType: locationType,
        locationUrl: locationUrl,
        selectedDate: selectedDate,
        selectedTime: selectedTime,
        themeColor: themeColor,
        businessId: doc(db, "Business", user?.email),
        createdBy: user?.email,
        createdAt: new Date().toISOString(),
        doctorId: doctorId,
        clinicSlot: clinicSlot, // Add clinic slot type
        clinicTiming: getClinicTiming(doctorId, clinicSlot) // Add clinic timing
      });

      toast.success("New Meeting Event Created!");
      clearMeetingDetails();
      router.replace("/dashboard/meeting-type");
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting");
    }
  };

  // Add helper function to get clinic timing based on doctor and slot
  const getClinicTiming = (doctorId, clinicSlot) => {
    const doctorTimeSlots = {
      '3': { 
        'Morning Clinic': '8:30 AM - 9:30 AM', 
        'Evening Clinic': '7:30 PM - 8:30 PM' 
      },
      '4': { 
        'Morning Clinic': '8:00 AM - 9:00 AM',
        'Evening Clinic': '11:00 AM - 1:00 PM',
        'AfterNoon Clinic': '9:00 AM - 11:00 AM'
      },
      '5': {
        'Morning Clinic': '8:30 AM - 11:00 AM',
        'Evening Clinic': '7:00 PM - 9:00 PM'
      },
      '7': { 
        'Morning Clinic': '8:00 AM - 10:45 AM' 
      }
    };

    // Default timings if doctor not found
    const defaultTimings = {
      'Morning Clinic': '9:00 AM - 12:00 PM',
      'Evening Clinic': '1:00 PM - 6:00 PM'
    };

    return doctorTimeSlots[doctorId]?.[clinicSlot] || defaultTimings[clinicSlot] || 'Timing not specified';
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-4xl mx-auto">
      <Link href={"/dashboard"} onClick={clearMeetingDetails}>
        <h2 className="flex gap-2">
          <ChevronLeft /> Cancel
        </h2>
      </Link>
      <div className="mt-4">
        <h2 className="font-bold text-2xl my-4">Create New Event</h2>
        <hr></hr>
      </div>
      <div className="flex flex-col gap-3 my-4">
        <h2 className="font-bold">Event Name *</h2>
        <Input
          placeholder="Name of your meeting event"
          value={eventName}
          onChange={(event) => setEventName(event.target.value)}
        />

        <h2 className="font-bold">Duration *</h2>
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

        <h2 className="font-bold">Location *</h2>
        <div className="grid grid-cols-1 gap-3">
          <div
            className={`border flex flex-col justify-center items-center p-2 rounded-lg cursor-pointer hover:bg-blue-100 hover:border-primary w-28 ${
              locationType === locationTypes[0].name && "bg-blue-100 border-primary"
            }`}
            onClick={() => {
              setLocationType(locationTypes[0].name);
              handleLocationUrl(locationTypes[0].name);
            }}
          >
            <img 
              src={locationTypes[0].icon} 
              alt={locationTypes[0].name} 
              className="w-8 h-8 mb-1"
            />
            <h2 className="text-sm">{locationTypes[0].name}</h2>
          </div>
        </div>

        {locationType && (
          <>
            <h2 className="font-bold">Zoom Meeting URL *</h2>
            <Input
              placeholder="Generated Zoom URL"
              value={locationInputUrl || ""}
              readOnly
            />
          </>
        )}

        <h2 className="font-bold">Select Theme Color</h2>
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

      <Button
        className="w-full mt-9"
        disabled={!isFormValid()}
        onClick={onCreateClick}
      >
        Create
      </Button>
    </div>
  );
}

export default MeetingForm;
