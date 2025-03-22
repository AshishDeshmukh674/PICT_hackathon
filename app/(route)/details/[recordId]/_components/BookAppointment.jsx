"use client";
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "../../../../../components/ui/dialog";
import { Button } from "../../../../../components/ui/button";
import { Calendar } from "../../../../../components/ui/calendar";
import { CalendarDays, Clock } from 'lucide-react';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import GlobalApi from '../../../../../app/_utils/GlobalApi';
import { useRouter } from 'next/navigation';
import { cn } from '../../../../../lib/utils';

import axios from 'axios'; // Make sure to import axios

function BookAppointment({ doctor }) {
    const [date, setDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [bookedSlotsByDate, setBookedSlotsByDate] = useState({});
    const [note, setNote] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const { user } = useKindeBrowserClient() || {};
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [clinicType, setClinicType] = useState('Morning Clinic - Ratnamukund Clinic, Warje');
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const getTimeSlotsForDoctor = (doctorId) => {
        const doctorTimeSlots = {
            '3': { morning: [[8, 30], [9, 30]], evening: [[19, 30], [20, 30]] }, // 8:30 AM to 9:30 AM
            '4': { 
                morning: [[8, 0], [9, 0]], 
                evening: [[11, 0], [1, 0]],
                AfterNoon: [[9, 0], [11, 0]]
            },
            '5': { // Special case for ID 5
                morning: [[8, 30], [11, 0]], 
                evening: [[19, 0], [21, 0]]
            },
            '7': { morning: [[8, 0], [10, 45]] },
        };
        return doctorTimeSlots[doctorId] || { morning: [[9, 0], [12, 0]], evening: [[13, 0], [18, 0]] };
    };
    
    const updateAvailableTimeSlots = (bookedSlots) => {
        const timeList = [];
        const clinicTypeOnly = clinicType.split(" - ")[0];
        const { morning, evening, AfterNoon } = getTimeSlotsForDoctor(doctor.id);
    
        const isToday = isSameDay(date, new Date());
        const now = new Date();
        const dayOfWeek = date.getDay();
    
        if (dayOfWeek === 0) {
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
                    currentMinutes += 15;
                    if (currentMinutes === 60) {
                        currentHour++;
                        currentMinutes = 0;
                    }
                    continue;
                }
    
                const formattedTime = formatTime(slotTime);
                if (!bookedSlots.includes(formattedTime)) {
                    timeList.push(formattedTime);
                }
    
                currentMinutes += 15;
                if (currentMinutes === 60) {
                    currentHour++;
                    currentMinutes = 0;
                }
            }
        };
    
        if (doctor.id === 5) {
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
    
    useEffect(() => {
        if (!date) return;

        const fetchBookedSlotsAndUpdateTimeSlots = async () => {
            try {
                const dateStr = date.toLocaleDateString('en-CA');
                const response = await GlobalApi.getDoctorAppointmentsByDate(doctor.id, dateStr);
                const bookedTimes = response.data.data
                    ? response.data.data.map(appointment => appointment.attributes.Time)
                    : [];
                setBookedSlotsByDate(prev => ({
                    ...prev,
                    [dateStr]: bookedTimes
                }));
                updateAvailableTimeSlots(bookedTimes);
            } catch (error) {
                console.error("Failed to fetch booked slots:", error);
            }
        };

        const interval = setInterval(fetchBookedSlotsAndUpdateTimeSlots, 1000);
        fetchBookedSlotsAndUpdateTimeSlots();

        return () => clearInterval(interval);
    }, [date, clinicType, doctor.id]);
    

    const saveBooking = async () => {
        setLoading(true);
        setSuccessMessage('');
    
        if (!user) {
            setSuccessMessage('User is not authenticated. Please log in and try again.');
            setLoading(false);
            return;
        }
    
        if (!phoneNumber) {
            setSuccessMessage('Phone number is required.');
            setLoading(false);
            return;
        }
    
        if (!selectedTimeSlot) {
            setSuccessMessage('Please select a time slot.');
            setLoading(false);
            return;
        }

        if (!date) {
            setSuccessMessage('Please select a date.');
            setLoading(false);
            return;
        }
    
        const dateStr = date.toLocaleDateString('en-CA'); // Now date is guaranteed to exist
    
        // Fetch the latest booked slots before saving the booking
        try {
            const response = await GlobalApi.getDoctorAppointmentsByDate(doctor.id, dateStr);
            const bookedSlots = response.data.data
                ? response.data.data.map(appointment => appointment.attributes.Time)
                : [];
    
            // Check if the selected time slot has already been booked by another user
            if (bookedSlots.includes(selectedTimeSlot)) {
                setSuccessMessage('This time slot has just been booked. Please select another time.');
                setLoading(false);
                return;
            }
    
            // Proceed with the booking if the time slot is still available
            const data = {
                data: {
                    UserName: `${user.given_name || ''} ${user.family_name || ''}`.trim(),
                    Email: user.email,
                    Time: selectedTimeSlot,
                    Date: dateStr,
                    doctor: doctor.id,
                    PhoneNumber: phoneNumber,
                }
            };
    
            // Save the appointment
            await GlobalApi.bookAppointment(data);
    
            // Prepare form data for the message
            const formData = {
                user_name: `${user.given_name || ''} ${user.family_name || ''}`.trim(),
                user_phone: phoneNumber,
                date: date.toLocaleDateString('en-GB'),
                time: selectedTimeSlot,
                doctorName: doctor?.attributes?.Name
            };
    
            // Send the message
            await sendMessage(formData);
    
            setSuccessMessage('Booking Successful! You will be redirected shortly.');
            setTimeout(() => router.push('/my-booking'), 2000);
        } catch (error) {
            console.error("Booking failed:", error.response ? error.response.data : error.message);
            setSuccessMessage(`Booking Failed. Error: ${error.response ? error.response.data.message : error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    
    const sendMessage = async (formData) => {
        const phoneNumbers = [
            "+918149623527",
            // "+919822038877",
            // "+919764432460",
        ];
    
        try {
            const promises = phoneNumbers.map(async (number) => {
                const response = await axios.post(
                    `https://graph.facebook.com/v16.0/405802159279444/messages`,
                    {
                        messaging_product: "whatsapp",
                        to: number,
                        type: "template",
                        template: {
                            name: "booking_appointment",
                            language: { code: "en" },
                            components: [
                                {
                                    type: "body",
                                    parameters: [
                                        { type: "text", text: formData.user_name },  // {{1}}
                                        { type: "text", text: formData.user_phone },  // {{2}}
                                        { type: "text", text: formData.date },  // {{3}}
                                        { type: "text", text: formData.time },  // {{4}}
                                        { type: "text", text: formData.doctorName }  // {{5}}
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        headers: {
                            "Authorization": `Bearer EAAE2eCrRWPkBO5IJD2ZCjepnBu16tfITg1aSWXeVuoqMEXWLE0ME2JZAKRNQUeE5T19rKzPltkk5PNuxSfwqnxzRWJtJuoCAqBTJxTANQW7hRnlHvYokTVPVjPccghhJVCBCiKZBlUKAUvnzJmuftZCOesX5uNVIJ94YvaZBBEwKWfFt9BQ1qDjlfZAQ4C7uPZBDQZDZD`,  // Replace with your access token
                            "Content-Type": "application/json"
                        }
                    }
                );
    
                if (response.status !== 200) {
                    throw new Error(`Failed to send message to ${number}: ${response.data.error.message}`);
                }
            });
    
            await Promise.all(promises);
    
            return "Your message has been sent successfully to all recipients.";
        } catch (error) {
            console.error(`Failed to send message: ${error.message}`);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    };
    
    const isPastDay = (day) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return day < today;
    };

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

    const handleMonthChange = (month) => {
        setCurrentMonth(month);
    };

    // Add this function to check if a date has available slots
    const hasAvailableSlots = (date) => {
        const clinicTypeOnly = clinicType.split(" - ")[0];
        const dayOfWeek = date.getDay();
        
        if (doctor.id === 5) {
            return (clinicTypeOnly === 'Morning Clinic' && (dayOfWeek === 1 || dayOfWeek === 6)) ||
                   (clinicTypeOnly === 'Evening Clinic' && dayOfWeek === 4);
        }
        
        return true; // For other doctors
    };

    return (
        <Dialog>
            <DialogTrigger>
                <Button className='mt-3 rounded-full'>Book Appointment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-4 sm:p-6">
                <div className="h-full flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Book Appointment</DialogTitle>
                        <div className="mt-4">
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
                                <div className='flex flex-col gap-4'>
                                    <h2 className='flex gap-2 items-center text-lg md:text-xl'>
                                        <CalendarDays className='text-primary h-5 w-5' />
                                        Select Date
                                    </h2>
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(newDate) => setDate(newDate)}
                                            month={currentMonth}
                                            onMonthChange={handleMonthChange}
                                            className="rounded-lg w-full max-w-[350px]"
                                            disabled={(d) => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return d < today || !hasAvailableSlots(d);
                                            }}
                                            modifiers={{
                                                unavailable: (d) => !hasAvailableSlots(d)
                                            }}
                                            showOutsideDays={false}
                                            fixedWeeks={true}
                                            weekStartsOn={0}
                                            classNames={{
                                                months: "flex flex-col space-y-4",
                                                month: "space-y-4",
                                                caption: "flex justify-center relative items-center h-10",
                                                caption_label: "text-sm font-medium",
                                                nav: "hidden",
                                                table: "w-full border-collapse",
                                                head_row: "flex justify-between w-full",
                                                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                                                row: "flex w-full mt-2",
                                                cell: "text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                                                day: cn(
                                                    "h-9 w-9 p-0 font-normal",
                                                    "aria-selected:opacity-100",
                                                    "hover:bg-gray-100 hover:text-gray-900",
                                                    "focus-visible:bg-gray-100 focus-visible:text-gray-900 focus-visible:rounded-sm",
                                                    "text-sm transition-colors text-center"
                                                ),
                                                day_range_end: "day-range-end",
                                                day_range_start: "day-range-start",
                                                day_selected: 
                                                    "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                                                day_today: "bg-accent text-accent-foreground",
                                                day_outside: "invisible pointer-events-none",
                                                day_disabled: "text-gray-300 cursor-not-allowed",
                                                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                                day_hidden: "invisible",
                                                day_unavailable: "text-gray-300",
                                            }}
                                            components={{
                                                IconLeft: () => null,
                                                IconRight: () => null
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-4 px-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-gray-600 hover:text-gray-900"
                                            onClick={() => {
                                                const newDate = new Date(currentMonth);
                                                newDate.setMonth(currentMonth.getMonth() - 1, 1);
                                                const today = new Date();
                                                // Only allow navigation to current month and forward
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
                                                maxDate.setMonth(maxDate.getMonth() + 1);
                                                // Only allow navigation up to next year + 1 month
                                                if (newDate <= maxDate) {
                                                    setCurrentMonth(newDate);
                                                }
                                            }}
                                        >
                                            Next Month
                                        </Button>
                                    </div>
                                    <div className='mt-4'>
                                        <h2 className='flex gap-2 items-center text-lg md:text-xl'>
                                            <Clock className='text-primary h-5 w-5' />
                                            Select Clinic Type
                                        </h2>
                                        <select
                                            value={clinicType}
                                            onChange={(e) => setClinicType(e.target.value)}
                                            className="w-full mt-2 p-2 border rounded-md"
                                        >
                                            <option value="Morning Clinic - Ratnamukund Clinic, Warje">Morning Clinic - Ratnamukund Clinic, Warje</option>
                                            <option value="Evening Clinic - Ratnamukund Clinic, Warje">Evening Clinic - Ratnamukund Clinic, Warje</option>
                                            <option value="AfterNoon Clinic - Shashvat Clinic, Pune">AfterNoon Clinic - Shashwat Clinic, Pune</option>
                                        </select>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-4'>
                                    <h2 className='flex gap-2 items-center text-lg md:text-xl'>
                                        <Clock className='text-primary h-5 w-5' />
                                        Available Time Slots
                                    </h2>
                                    <div className='flex flex-wrap gap-2'>
                                        {timeSlots.length > 0 ? (
                                            timeSlots.map((slot, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedTimeSlot(slot)}
                                                    className={`p-2 border rounded-md ${selectedTimeSlot === slot ? 'bg-primary text-white' : 'bg-white'}`}
                                                >
                                                    {slot}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-gray-500">No available time slots for the selected date and clinic type.</div>
                                        )}
                                    </div>
                                    <div className='mt-5'>
                                        <label className='block text-lg md:text-xl'>
                                            Phone Number:<span className="text-red-500"> *</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className='w-full mt-2 p-2 border rounded-md'
                                            placeholder='Enter your phone number'
                                        />
                                    </div>
                                    <div className='mt-5'>
                                        <label className='block text-lg md:text-xl'>Notes:</label>
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className='w-full mt-2 p-2 border rounded-md'
                                            placeholder='Enter any additional notes'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col-reverse md:flex-row gap-3">
                        <Button
                            type="button"
                            onClick={saveBooking}
                            disabled={loading}
                            className="bg-primary text-white rounded-full"
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </Button>
                        <DialogClose>
                            <Button className='rounded-full'>Close</Button>
                        </DialogClose>
                    </DialogFooter>
                    {successMessage && (
                        <div className="text-center text-red-600 mt-3">
                            {successMessage}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default BookAppointment;