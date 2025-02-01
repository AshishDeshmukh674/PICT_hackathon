import { Button } from "../../../../components/ui/button";
import { Calendar } from "../../../../components/ui/calendar";
import { Clock, MapPin, Calendar as CalendarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import GlobalApi from '../../../_utils/GlobalApi';
import { useSearchParams } from 'next/navigation';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app } from '../../../config/FirebaseConfig';

function PreviewMeeting({ formValue, setFormValue }) {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [doctorSlots, setDoctorSlots] = useState(null);
  const [clinicType, setClinicType] = useState('Morning Clinic');
  const [doctorId, setDoctorId] = useState(null);
  const searchParams = useSearchParams();
  const db = getFirestore(app);

  const getTimeSlotsForDoctor = (doctorId) => {
    const doctorTimeSlots = {
      '3': { morning: [[8, 30], [9, 30]], evening: [[19, 30], [20, 30]] },
      '4': { 
        morning: [[8, 0], [9, 0]], 
        evening: [[11, 0], [1, 0]],
        AfterNoon: [[9, 0], [11, 0]]
      },
      '5': {
        morning: [[8, 30], [11, 0]], 
        evening: [[19, 0], [21, 0]]
      },
      '7': { morning: [[8, 0], [10, 45]] },
    };
    return doctorTimeSlots[doctorId] || { morning: [[9, 0], [12, 0]], evening: [[13, 0], [18, 0]] };
  };

  useEffect(() => {
    setMounted(true);
    // Load saved values from localStorage
    const savedDate = localStorage.getItem("selectedDate");
    const savedTime = localStorage.getItem("selectedTime");
    if (savedDate) setDate(new Date(savedDate));
    if (savedTime) setSelectedTime(savedTime);

    // Add console.log to debug formValue
    console.log("Current formValue:", formValue);
  }, []);

  // Add this useEffect to get doctor ID from URL
  useEffect(() => {
    const id = searchParams.get('doctorId');
    if (id) {
      setDoctorId(id);
      setFormValue(prev => ({...prev, doctorId: id}));
    }
  }, [searchParams]);

  // Add new useEffect for fetching booked slots
  useEffect(() => {
    const fetchBookedSlotsAndUpdateTimeSlots = async () => {
      try {
        const dateStr = date.toLocaleDateString('en-CA');
        console.log('Fetching booked slots for date:', dateStr);
        const response = await GlobalApi.getDoctorAppointmentsByDate(doctorId, dateStr);
        const bookedTimes = response.data.data
          ? response.data.data.map(appointment => appointment.attributes.Time)
          : [];
        
        // Update time slots excluding booked ones
        createTimeSlot(formValue?.duration || 30, bookedTimes);
      } catch (error) {
        console.error("Failed to fetch booked slots:", error.response ? error.response.data : error.message);
      }
    };

    if (date && clinicType && doctorId) {
      fetchBookedSlotsAndUpdateTimeSlots();
    }
  }, [date, clinicType, doctorId]);

  /**
   * Creates time slots based on interval
   * @param {*} interval
   */
  const createTimeSlot = (interval, bookedSlots = []) => {
    if (!doctorId) return;

    const timeList = [];
    const clinicTypeOnly = clinicType.split(" - ")[0];
    const { morning, evening, AfterNoon } = getTimeSlotsForDoctor(doctorId);

    const isToday = isSameDay(date, new Date());
    const isTomorrow = isSameDay(date, new Date(Date.now() + 24 * 60 * 60 * 1000));
    const now = new Date();
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || isTomorrow) {
      setTimeSlots([]);
      return;
    }

    const generateTimeSlots = (startTime, endTime) => {
      let [currentHour, currentMinutes] = startTime;
      const [endHour, endMinutes] = endTime;

      while (currentHour < endHour || (currentHour === endHour && currentMinutes < endMinutes)) {
        const slotTime = new Date(date);
        slotTime.setHours(currentHour, currentMinutes);

        if (isToday && slotTime <= now) {
          currentMinutes += interval;
          if (currentMinutes >= 60) {
            currentHour += Math.floor(currentMinutes / 60);
            currentMinutes = currentMinutes % 60;
          }
          continue;
        }

        const formattedTime = formatTime(slotTime);
        if (!bookedSlots.includes(formattedTime)) {
          timeList.push(formattedTime);
        }

        currentMinutes += interval;
        if (currentMinutes >= 60) {
          currentHour += Math.floor(currentMinutes / 60);
          currentMinutes = currentMinutes % 60;
        }
      }
    };

    // Special case for doctor ID 5
    if (doctorId === '5') {
      if (clinicTypeOnly === 'Morning Clinic' && (dayOfWeek === 1 || dayOfWeek === 6)) {
        generateTimeSlots(morning[0], morning[1]);
      } else if (clinicTypeOnly === 'Evening Clinic' && dayOfWeek === 4) {
        generateTimeSlots(evening[0], evening[1]);
      } else {
        setTimeSlots([]);
        return;
      }
    } else {
      if (clinicTypeOnly === 'Morning Clinic' && morning) {
        generateTimeSlots(morning[0], morning[1]);
      } else if (clinicTypeOnly === 'Evening Clinic' && evening) {
        generateTimeSlots(evening[0], evening[1]);
      } else if (clinicTypeOnly === 'AfterNoon Clinic' && AfterNoon) {
        generateTimeSlots(AfterNoon[0], AfterNoon[1]);
      }
    }

    setTimeSlots(timeList);
  };

  /**
   * Checks if a time slot should be disabled
   * @param {*} slotMinutes
   * @returns {boolean}
   */
  const isTimeSlotDisabled = (slotMinutes) => {
    const currentDate = new Date();
    const selectedDate = new Date(date);
    
    // If selected date is today
    if (selectedDate.toDateString() === currentDate.toDateString()) {
      const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
      return slotMinutes <= currentMinutes + 30; // Disable slots that are within 30 mins from now
    }
    
    // If selected date is in the past
    return selectedDate < new Date(currentDate.setHours(0, 0, 0, 0));
  };

  /**
   * Handles time slot selection
   * @param {string} time
   */
  const handleTimeSlotClick = (time) => {
    if (!isTimeSlotDisabled(time.minutes)) {
      setSelectedTime(time.time);
      localStorage.setItem("selectedTime", time.time);
      if (setFormValue) {
        setFormValue((prev) => ({ ...prev, selectedTime: time.time }));
      }
    }
  };

  const handleDateSelect = (newDate) => {
    if (!newDate) return;
    setDate(newDate);
    const dateString = newDate.toISOString();
    localStorage.setItem("selectedDate", dateString);
    if (setFormValue) {
      setFormValue((prev) => ({ ...prev, selectedDate: dateString }));
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async (platform) => {
    try {

      // Debug log
      console.log("Sharing formValue:", formValue);

      // Get meeting URL from localStorage as backup if formValue.locationUrl is undefined
      const meetingUrl =
        formValue?.locationUrl || localStorage.getItem("locationUrl");
      const eventName =
        formValue?.eventName ||
        localStorage.getItem("eventName") ||
        "New Meeting";

      if (!meetingUrl) {
        toast.error("No meeting URL available to share");
        return;
      }

      const eventDetails = `Join my meeting: ${eventName}`;
      const shareText = `${eventDetails}\n\nMeeting Link: ${meetingUrl}`;

      switch (platform) {
        case "whatsapp":
          window.open(
            `https://wa.me/?text=${encodeURIComponent(shareText)}`,
            "_blank"
          );
          break;

        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareText
            )}`,
            "_blank"
          );
          break;

        case "email":
          window.open(
            `mailto:?subject=${encodeURIComponent(
              eventName
            )}&body=${encodeURIComponent(shareText)}`,
            "_blank"
          );
          break;

        case "copy":
          await navigator.clipboard.writeText(shareText);
          toast.success("Meeting details copied to clipboard!");
          break;

        default:
          if (navigator.share) {
            await navigator.share({
              title: eventName,
              text: shareText,
              url: meetingUrl,
            });
          } else {
            await navigator.clipboard.writeText(shareText);
            toast.success("Meeting details copied to clipboard!");
          }
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast.error("Failed to save meeting details");
    }
  };

  const handleMonthChange = (month) => {
    setCurrentMonth(month);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1, 1);
    const today = new Date();
    if (newDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1, 1);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (newDate <= maxDate) {
      setCurrentMonth(newDate);
    }
  };

  // Add these helper functions near the top of the component
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Update the clinic type change handler
  const handleClinicTypeChange = (e) => {
    setClinicType(e.target.value);
    // Clear selected time when clinic type changes
    setSelectedTime(null);
    localStorage.removeItem("selectedTime");
    if (setFormValue) {
      setFormValue((prev) => ({ ...prev, selectedTime: null }));
    }
  };

  // If not mounted yet, return null or a loading state
  if (!mounted) {
    return null; // or return a loading spinner
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-white rounded-xl shadow-lg border-t-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Meeting Info */}
        <div className="lg:col-span-4">
          <div className="space-y-6 p-6 bg-gray-50 rounded-xl shadow-sm">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Business Name</h3>
              <h2 className="font-bold text-2xl text-gray-900 mt-1">
                {formValue?.eventName || "Meeting Name"}
              </h2>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="font-medium">
                  {mounted ? `${formValue?.duration || ""} Minutes` : ""}
                </span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{formValue?.locationType} Meeting</span>
              </div>

              {formValue?.locationUrl && (
                <div className="flex items-center gap-3 pl-8">
                  <Link
                    href={formValue.locationUrl}
                    className="text-blue-600 hover:text-blue-800 break-all text-sm"
                  >
                    {formValue.locationUrl}
                  </Link>
                </div>
              )}

              {selectedTime && (
                <div className="flex items-center gap-3 text-gray-700 bg-white p-3 rounded-lg border border-gray-100">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{formatDate(date)}</div>
                    <div className="text-blue-600 font-semibold">{selectedTime}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar & Time Selection */}
        <div className="lg:col-span-8">
          <div className="space-y-6">
            <h2 className="font-bold text-xl text-gray-900">
              Select Date & Time
            </h2>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <div className="flex flex-col space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                  {/* Add Clinic Type Selection */}
                  <select
                    value={clinicType}
                    onChange={handleClinicTypeChange}
                    className="w-full p-2 border rounded-md mb-4"
                  >
                    <option value="Morning Clinic">Morning Clinic</option>
                    <option value="Evening Clinic">Evening Clinic</option>
                    <option value="AfterNoon Clinic">Afternoon Clinic</option>
                  </select>

                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    month={currentMonth}
                    onMonthChange={handleMonthChange}
                    className="rounded-lg w-full max-w-[350px]"
                    disabled={(d) => d < new Date().setHours(0, 0, 0, 0)}
                    showOutsideDays={false}
                    fixedWeeks={true}
                    ISOWeek={true}
                    classNames={{
                      months: "flex flex-col space-y-4",
                      month: "space-y-4",
                      caption: "flex justify-center relative items-center h-10",
                      caption_label: "text-sm font-medium",
                      nav: "hidden",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex justify-between",
                      head_cell: "text-gray-500 font-medium text-sm w-9 h-9",
                      row: "flex w-full mt-2 justify-between",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal hover:bg-gray-100 rounded-lg transition-colors",
                      day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-lg",
                      day_today: "bg-gray-50 text-gray-900 rounded-lg font-semibold",
                      day_outside: "hidden",
                      day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
                
                {/* Custom Month Navigation */}
                <div className="flex justify-between items-center px-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(currentMonth.getMonth() - 1, 1);
                      const today = new Date();
                      if (newDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
                        setCurrentMonth(newDate);
                      }
                    }}
                  >
                    Previous Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(currentMonth.getMonth() + 1, 1);
                      const maxDate = new Date();
                      maxDate.setFullYear(maxDate.getFullYear() + 1);
                      if (newDate <= maxDate) {
                        setCurrentMonth(newDate);
                      }
                    }}
                  >
                    Next Month
                  </Button>
                </div>
              </div>

              <div className="min-w-[200px] max-w-[280px] lg:max-h-[450px]">
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 pr-2">
                  {timeSlots?.length > 0 ? (
                    timeSlots.map((time, index) => (
                      <Button
                        key={index}
                        className={`w-full justify-center text-sm font-medium transition-all duration-200 rounded-lg
                          ${selectedTime === time
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                          }`}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => handleTimeSlotClick({ time, minutes: 0 })}
                      >
                        {time}
                      </Button>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No available time slots for selected date
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-gray-100">
        {[
          { platform: "whatsapp", label: "Share on WhatsApp" },
          { platform: "twitter", label: "Share on Twitter" },
          { platform: "email", label: "Share via Email" },
          { platform: "copy", label: "Copy Link" }
        ].map(({ platform, label }) => (
          <Button
            key={platform}
            variant="outline"
            className="bg-white hover:bg-gray-50 transition-colors duration-200"
            onClick={() => handleShare(platform)}
            disabled={
              !formValue?.locationUrl && !localStorage.getItem("locationUrl")
            }
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default PreviewMeeting;
