"use client";
import { Button } from "../../../../../components/ui/button";
import { app } from "../../../../config/FirebaseConfig";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Clock, Copy, MapPin, Pen, Settings, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../../components/ui/dropdown-menu";
import ShareModal from "./ShareModal"; // Import ShareModal here

function MeetingEventList() {
  const db = getFirestore(app);
  const { user } = useKindeBrowserClient();
  const [businessInfo, setBusinessInfo] = useState();
  const [eventList, setEventList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // Track selected event for sharing

  useEffect(() => {
    if (user) {
      getEventList();
      BusinessInfo();
    }
  }, [user]);

  const getEventList = async () => {
    try {
      const q = query(
        collection(db, "MeetingEvent"),
        where("createdBy", "==", user?.email),
        orderBy("id", "desc")
      );

      const querySnapshot = await getDocs(q);
      // Create a new array instead of updating state in forEach
      const events = querySnapshot.docs.map((doc) => doc.data());
      setEventList(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load meetings");
    }
  };

  const BusinessInfo = async () => {
    const docRef = doc(db, "Business", user.email);
    const docSnap = await getDoc(docRef);
    setBusinessInfo(docSnap.data());
  };

  const onDeleteMeetingEvent = async (event) => {
    await deleteDoc(doc(db, "MeetingEvent", event?.id)).then((resp) => {
      toast("Meeting Event Deleted!");
      getEventList();
    });
  };

  const onCopyClickHandler = async (event) => {
    // Fetch the event document to get the locationUrl
    const eventDocRef = doc(db, "MeetingEvent", event.id);
    const eventDocSnap = await getDoc(eventDocRef);

    if (eventDocSnap.exists()) {
      const locationUrl = eventDocSnap.data().locationUrl; // Get locationUrl from the document
      navigator.clipboard.writeText(locationUrl); // Copy the URL to clipboard
      toast("Copied to Clipboard");
    } else {
      toast("Event not found!");
    }
  };

  const onShareClickHandler = (event) => {
    setSelectedEvent(event); // Set selected event to trigger modal
  };

  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
      {eventList.length > 0 ? (
        eventList?.map((event, index) => (
          <div
            className="border shadow-md border-t-8 rounded-lg p-5 flex flex-col gap-3"
            style={{ borderTopColor: event?.themeColor }}
            key={event.id}
          >
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Settings className="cursor-pointer" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {/* <DropdownMenuItem className="flex gap-2">
                    <Pen /> Edit
                  </DropdownMenuItem> */}
                  <DropdownMenuItem
                    className="flex gap-2"
                    onClick={() => onDeleteMeetingEvent(event)}
                  >
                    <Trash /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <h2 className="font-medium text-xl">{event?.eventName}</h2>
            <div className="flex justify-between">
              <h2 className="flex gap-2 text-gray-500">
                <Clock /> {event.duration} Min{" "}
              </h2>
              <h2 className="flex gap-2 text-gray-500">
                <MapPin /> {event.locationType}{" "}
              </h2>
            </div>
            <hr />
            <div className="flex justify-between">
              <h2
                className="flex gap-2 text-sm text-primary items-center cursor-pointer"
                onClick={() => {
                  onCopyClickHandler(event);
                }}
              >
                <Copy className="h-4 w-4" /> Copy Link{" "}
              </h2>
              <Button
                variant="outline"
                className="rounded-full text-primary border-primary"
                onClick={() => onShareClickHandler(event)} // Open share modal
              >
                Share
              </Button>
            </div>
          </div>
        ))
      ) : (
        <h2>Loading...</h2>
      )}

      {/* If selected event exists, show ShareModal */}
      {selectedEvent && (
        <ShareModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)} // Close modal onClose
        />
      )}
    </div>
  );
}

export default MeetingEventList;