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
import { doc, getFirestore, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { app } from "../../../config/FirebaseConfig";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const [clinicType, setClinicType] = useState('Evening Clinic');

  const isBrowser = typeof window !== "undefined";

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
      clinicType: localStorage.getItem("clinicType") || 'Evening Clinic',
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

    setEventName("");
    setDuration(30);
    setLocationType("");
    setLocationUrl("");
    setThemeColor("");
    setLocationInputUrl("");
    
    localStorage.removeItem("locationType");
    localStorage.removeItem("clinicType");
    localStorage.removeItem("selectedDate");
    localStorage.removeItem("selectedTime");
  };

  const handleLocationUrl = async (type) => {
    setLocationType(type);
    localStorage.setItem("locationType", type);

    try {
      // Get the selected date and time from localStorage
      const selectedDate = localStorage.getItem("selectedDate");
      const selectedTime = localStorage.getItem("selectedTime");
      
      // Convert time to 24-hour format for the API
      let startTime = selectedDate;
      if (selectedTime) {
        const [time, period] = selectedTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let militaryHours = hours;
        if (period === 'PM' && hours !== 12) militaryHours += 12;
        if (period === 'AM' && hours === 12) militaryHours = 0;
        startTime = `${selectedDate}T${String(militaryHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      }

      const response = await axios.post("/api/zoom/create-meeting", {
        topic: eventName || "New Meeting",
        type: 2, // Scheduled meeting
        start_time: startTime || new Date().toISOString(),
        duration: duration,
        timezone: "Asia/Kolkata",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: false,
          auto_recording: "none",
          waiting_room: false
        }
      });

      if (response.data.join_url) {
        setLocationUrl(response.data.join_url);
        setLocationInputUrl(response.data.join_url);
        setFormValue((prev) => ({ ...prev, locationUrl: response.data.join_url }));
      } else {
        throw new Error("Failed to create Zoom meeting");
      }
    } catch (error) {
      console.error("Error creating Zoom meeting:", error);
      toast.error("Failed to create Zoom meeting");
    }
  };

  const isFormValid = () => {
    if (typeof window === 'undefined') return false;

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
      const selectedDate = localStorage.getItem("selectedDate");
      const selectedTime = localStorage.getItem("selectedTime");

      // Verify the slot is still available
      const isSlotAvailable = await checkSlotAvailability(selectedDate, selectedTime);
      if (!isSlotAvailable) {
        toast.error("This time slot is no longer available. Please select another time.");
        return;
      }

      await setDoc(doc(db, "MeetingEvent", id), {
        id: id,
        eventName: eventName,
        duration: duration,
        locationType: locationType,
        locationUrl: locationUrl,
        selectedDate: selectedDate, // This will be in YYYY-MM-DD format
        selectedTime: selectedTime,
        themeColor: themeColor,
        businessId: doc(db, "Business", user?.email),
        createdBy: user?.email,
        createdAt: new Date().toISOString(),
        doctorId: doctorId,
        clinicType: 'Evening Clinic', // Always Evening Clinic for online meetings
        clinicTiming: getClinicTiming(doctorId) // Updated to only return evening timing
      });

      toast.success("New Meeting Event Created!");
      clearMeetingDetails();
      router.replace("/dashboard/meeting-type");
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting");
    }
  };

  // Add function to check slot availability
  const checkSlotAvailability = async (selectedDate, selectedTime) => {
    try {
      const meetingsRef = collection(db, "MeetingEvent");
      const q = query(meetingsRef, 
        where("doctorId", "==", doctorId),
        where("selectedDate", "==", selectedDate),
        where("selectedTime", "==", selectedTime)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty; // Returns true if no meetings exist for this slot
    } catch (error) {
      console.error("Error checking slot availability:", error);
      return false;
    }
  };

  // Update getClinicTiming function to only return evening timing
  const getClinicTiming = (doctorId) => {
    const doctorTimeSlots = {
      '3': '8:00 PM - 10:00 PM',
      '4': '8:00 PM - 10:00 PM',
      '5': '8:00 PM - 10:00 PM',
      '7': '8:00 PM - 10:00 PM'
    };

    return doctorTimeSlots[doctorId] || '8:00 PM - 10:00 PM';
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

        <div className="flex flex-col gap-4">
          <h2 className="font-bold">Select Theme Color</h2>
          <div className="grid grid-cols-6 gap-4">
            {ThemeOptions.map((color, index) => (
              <button
                key={index}
                className={`w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 ${
                  themeColor === color ? 'ring-2 ring-offset-2 ring-black' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setThemeColor(color)}
                title={`Theme Color ${index + 1}`}
              />
            ))}
          </div>
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
