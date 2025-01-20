"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import ScheduledMeetingList from "./_components/ScheduledMeetingList";
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
      console.log("Current user email:", user?.email);
      getScheduledMeetings();
    }
  }, [user]);

  const getScheduledMeetings = async () => {
    try {
      setLoading(true);
      console.log("Fetching meetings for email:", user?.email);

      const q = query(
        collection(db, "MeetingEvent"),
        where("createdBy", "==", user?.email)
      );

      const querySnapshot = await getDocs(q);
      console.log("Query executed, size:", querySnapshot.size);

      const meetings = [];
      querySnapshot.forEach((doc) => {
        console.log("Document data:", doc.data());
        meetings.push({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt,
          time: doc.data().time || "00:00",
        });
      });

      console.log("Processed meetings:", meetings);
      setMeetingList(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterMeetingList = (type) => {
    console.log("Filtering meetings for type:", type);
    console.log("Current meetingList:", meetingList);

    if (!meetingList.length) return [];

    const currentDate = new Date();

    return meetingList.filter((meeting) => {
      // Use date from the meeting object, fallback to createdAt
      const meetingDate = new Date(meeting.date || meeting.createdAt);

      // Set the time to the start of the day for comparison
      const meetingDateTime = new Date(meetingDate);
      meetingDateTime.setHours(0, 0, 0, 0);

      const currentDateTime = new Date();
      currentDateTime.setHours(0, 0, 0, 0);

      console.log("Meeting:", meeting.eventName);
      console.log("Meeting date:", meetingDateTime);
      console.log("Current date:", currentDateTime);

      if (type === "upcoming") {
        return meetingDateTime >= currentDateTime;
      } else {
        return meetingDateTime < currentDateTime;
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
                    borderTop: `4px solid ${meeting.themeColor || "#8B5CF6"}`,
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
                    <div className="flex gap-3">
                      <button
                        className="text-primary flex items-center gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(meeting.locationUrl);
                          // Optionally add a toast notification here
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
                  className="border rounded-lg p-5 hover:border-primary cursor-pointer"
                  style={{
                    borderTop: `4px solid ${meeting.themeColor || "#10B981"}`,
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
