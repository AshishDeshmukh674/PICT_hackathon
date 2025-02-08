"use client";
import React from "react";
import MeetingForm from "./_components/MeetingForm";
import PreviewMeeting from "./_components/PreviewMeeting";
import { useSearchParams } from 'next/navigation';

export default function CreateMeeting() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctor');

  const [formValue, setFormValue] = React.useState({
    eventName: "",
    duration: 30,
    locationType: "",
    locationUrl: "",
    themeColor: "",
    selectedDate: null,
    selectedTime: null,
    doctorId: doctorId
  });

  // Add useEffect to clear localStorage on component mount
  React.useEffect(() => {
    // Preserve Zoom token if exists
    const zoomToken = localStorage.getItem("zoomAccessToken");

    // Clear localStorage
    localStorage.clear();

    // Restore Zoom token if it existed
    if (zoomToken) {
      localStorage.setItem("zoomAccessToken", zoomToken);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-screen bg-gray-50">
      {/* Meeting Form */}
      <div className="bg-white shadow-md border-r flex flex-col">
        <MeetingForm setFormValue={setFormValue} />
      </div>
      {/* Preview */}
      <div className="md:col-span-2 p-4">
        <PreviewMeeting formValue={formValue} setFormValue={setFormValue} />
      </div>
    </div>
  );
}