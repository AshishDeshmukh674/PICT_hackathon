"use client";
import { useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { app } from "@/config/FirebaseConfig";
import { toast } from "sonner";
import ScheduledMeetingList from "../dashboard/scheduled-meeting/_components/ScheduledMeetingList";

export default function ScheduledMeetings() {
  const [meetingList, setMeetingList] = useState([]);
  const { user } = useKindeBrowserClient();
  const db = getFirestore(app);

  useEffect(() => {
    if (user) {
      getMeetingList();
    }
  }, [user]);

  const getMeetingList = async () => {
    try {
      const q = query(
        collection(db, "MeetingEvent"),
        where("createdBy", "==", user?.email)
      );

      const querySnapshot = await getDocs(q);
      const meetings = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      setMeetingList(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
    }
  };

  const handleStartMeeting = (meeting) => {
    if (meeting.locationType === "Zoom") {
      window.open(meeting.locationUrl, "_blank");
    } else {
      toast.error("This meeting type doesn't support direct start");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Scheduled Meetings</h1>
      <ScheduledMeetingList
        meetingList={meetingList}
        onStartMeeting={handleStartMeeting}
      />
    </div>
  );
}