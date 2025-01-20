import React from "react";
import { Button } from "../../../../../components/ui/button";
import { toast } from "sonner";

const ShareModal = ({ event, onClose }) => {
  const shareText = `Join my meeting: ${event.eventName}\nDuration: ${event.duration} minutes`;
  const meetingUrl = event.locationUrl;

  const handleShare = async (platform) => {
    if (!meetingUrl) {
      toast.error("No meeting URL available to share");
      return;
    }

    const fullShareText = `${shareText}\n\nMeeting Link: ${meetingUrl}`;

    try {
      switch (platform) {
        case "whatsapp":
          window.open(
            `https://wa.me/?text=${encodeURIComponent(fullShareText)}`,
            "_blank"
          );
          break;

        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              fullShareText
            )}`,
            "_blank"
          );
          break;

        case "email":
          window.open(
            `mailto:?subject=${encodeURIComponent(
              event.eventName
            )}&body=${encodeURIComponent(fullShareText)}`,
            "_blank"
          );
          break;

        case "copy":
          await navigator.clipboard.writeText(fullShareText);
          toast.success("Meeting details copied to clipboard!");
          break;

        default:
          if (navigator.share) {
            await navigator.share({
              title: event.eventName,
              text: fullShareText,
              url: meetingUrl,
            });
          } else {
            await navigator.clipboard.writeText(fullShareText);
            toast.success("Meeting details copied to clipboard!");
          }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share meeting details");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-[90%]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium">Share {event.eventName}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => handleShare("whatsapp")}
          >
            Share on WhatsApp
          </Button>

          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => handleShare("twitter")}
          >
            Share on Twitter
          </Button>

          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => handleShare("email")}
          >
            Share via Email
          </Button>

          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => handleShare("copy")}
          >
            Copy to Clipboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
