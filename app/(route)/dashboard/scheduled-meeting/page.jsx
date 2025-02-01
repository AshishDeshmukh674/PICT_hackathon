"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { app } from "../../../config/FirebaseConfig";
import { Settings, Clock, Video, Link2 } from "lucide-react";

function ScheduledMeeting() {
  const db = getFirestore(app);
  const { user } = useKindeBrowserClient();
  const [meetingList, setMeetingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getScheduledMeetings();
    }
  }, [user]);

  const getScheduledMeetings = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "MeetingEvent"),
        where("createdBy", "==", user?.email)
      );

      const querySnapshot = await getDocs(q);
      const meetings = [];
      querySnapshot.forEach((doc) => {
        meetings.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log("Fetched meetings:", meetings); // Debug log
      setMeetingList(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterMeetingList = (type) => {
    if (!meetingList.length) return [];

    const currentDate = new Date();
    
    return meetingList.filter((meeting) => {
      // Convert clinicTiming to hours and minutes
      const timeStr = meeting.selectedTime.split(' ')[0]; // Get "8:30" from "8:30 AM"
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Parse the selectedDate
      const meetingDate = new Date(meeting.selectedDate);
      meetingDate.setHours(hours);
      meetingDate.setMinutes(minutes);
      meetingDate.setSeconds(0);
      meetingDate.setMilliseconds(0);

      console.log("Meeting:", meeting.eventName);
      console.log("Meeting date:", meetingDate);
      console.log("Current date:", currentDate);
      
      if (type === "upcoming") {
        return meetingDate > currentDate;
      } else {
        return meetingDate <= currentDate;
      }
    });
  };

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="p-10">
      <h2 className="font-bold text-2xl">Scheduled Meetings</h2>
      <hr className="my-5" />

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {filterMeetingList("upcoming").length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No upcoming meetings 
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterMeetingList("upcoming").map((meeting) => (
                <div
                  key={meeting.id}
                  className="border rounded-lg p-5 hover:border-primary cursor-pointer"
                  style={{
                    borderTop: `4px solid ${meeting.themeColor}`,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-xl">
                      {meeting.eventName}
                    </h3>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <Settings size={20} />
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock size={20} />
                      <span>{meeting.duration} Min</span>
                      <span className="ml-auto flex items-center gap-2">
                        <Video size={20} />
                        {meeting.locationType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{new Date(meeting.selectedDate).toLocaleDateString()}</span>
                      <span>{meeting.selectedTime}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="text-primary flex items-center gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(meeting.locationUrl);
                        }}
                      >
                        <Link2 size={18} />
                        Copy Link
                      </button>
                      <button className="ml-auto text-primary border border-primary px-4 py-1 rounded-full">
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired">
          {filterMeetingList("expired").length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No expired meetings
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterMeetingList("expired").map((meeting) => (
                <div
                  key={meeting.id}
                  className="border rounded-lg p-5 hover:border-primary cursor-pointer opacity-70"
                  style={{
                    borderTop: `4px solid ${meeting.themeColor}`,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-xl">
                      {meeting.eventName}
                    </h3>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <Settings size={20} />
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock size={20} />
                      <span>{meeting.duration} Min</span>
                      <span className="ml-auto flex items-center gap-2">
                        <Video size={20} />
                        {meeting.locationType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{new Date(meeting.selectedDate).toLocaleDateString()}</span>
                      <span>{meeting.clinicTiming}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="text-primary flex items-center gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(meeting.locationUrl);
                        }}
                      >
                        <Link2 size={18} />
                        Copy Link
                      </button>
                      <button className="ml-auto text-primary border border-primary px-4 py-1 rounded-full">
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ScheduledMeeting;
