"use client";
import React, { useState } from 'react';
import Image from 'next/image'; // For handling images in Next.js
import { MapPin, Calendar, Clock } from 'lucide-react'; // For icons
import { Button } from "/components/ui/button.jsx"; // Assuming you have a custom Button component
import moment from 'moment'; // For date formatting
import GlobalApi from '/app/_utils/GlobalApi.jsx';
import { useRouter } from 'next/navigation'; // Import useRouter

function BookingList({ bookingList, expired }) {
    const [localBookingList, setLocalBookingList] = useState(bookingList); // Initialize local state
    const router = useRouter(); // Initialize useRouter

    const handleCancelAppointment = async (id) => {
        try {
            // Call the cancel appointment function from GlobalApi
            await GlobalApi.cancelAppointment(id);

            // Update local bookingList by removing the canceled appointment
            setLocalBookingList(prevList => prevList.filter(item => item.id !== id));

            // Optionally refresh the page to ensure the latest data is loaded
            router.refresh();
        } catch (error) {
            console.error('Failed to cancel the appointment:', error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {localBookingList?.map((item, index) => (
                <div key={index} className='flex flex-col p-4 md:p-6 border rounded-lg'>
                    <div className='flex flex-col gap-2 w-full'>
                        <h2 className='font-bold text-[18px] items-center flex justify-between'>
                            {item.attributes.doctor.data.attributes.Name}
                            {!expired && (
                            <Button
                                variant='outline'
                                className='text-primary border-primary'
                                onClick={() => handleCancelAppointment(item.id)}
                            >
                                Cancel Appointment
                            </Button>
                            )}
                        </h2>
                        <h2 className='flex gap-2 text-gray-500'>
                            <MapPin className='text-primary h-5 w-5' />
                            {item.attributes.doctor.data.attributes.Address}
                        </h2>
                        <h2 className='flex gap-2'>
                            <Calendar className='text-primary h-5 w-5' />
                            Appointment on: {moment(item.attributes.Date).format('DD-MM-YYYY')}
                        </h2>
                        <h2 className='flex gap-2'>
                            <Clock className='text-primary h-5 w-5' />
                            Time: {item.attributes.Time}
                        </h2>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default BookingList;