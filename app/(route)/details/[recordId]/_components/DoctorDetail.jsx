"use client";
import React from 'react';
import Image from 'next/image';
import { GraduationCap, MapPin } from 'lucide-react';
import BookAppointment from '/app/(route)/details/[recordId]/_components/BookAppointment.jsx'; // Import the BookAppointment component

function DoctorDetail({ doctor }) {
    const socialMediaList = [
        { id: 1, icon: '/youtube.png', url: '' },
        { id: 2, icon: '/linkedin.png', url: '' },
        { id: 3, icon: '/twitter.png', url: '' },
        { id: 4, icon: '/facebook.png', url: '' }
    ];

    return (
        <div className='flex flex-col gap-5 p-4 md:p-6 lg:p-8 mt-5 border rounded-lg max-w-4xl mx-auto'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Doctor Image */}
                <div className='flex justify-center'>
                    <Image
                        src={doctor.attributes?.Image?.data?.[0]?.attributes?.url || '/default-doctor.png'}
                        width={200}
                        height={200}
                        alt='doctor-image'
                        className='rounded-lg w-full h-[280px] object-cover'
                    />
                </div>

                {/* Doctor Information */}
                <div className='flex flex-col gap-3 items-center md:items-start'>
                    <h2 className='font-bold text-2xl text-center md:text-left'>{doctor?.attributes?.Name || 'Doctor Name'}</h2>
                    <h2 className='flex gap-2 text-gray-500 text-md'>
                        <GraduationCap />
                        <span>{doctor?.attributes?.Year_of_Experience || 'N/A'} Years of Experience</span>
                    </h2>
                    <h2 className='text-md flex gap-2 text-gray-500'>
                        <MapPin />
                        <span>{doctor?.attributes?.Address || 'No Address Available'}</span>
                    </h2>
                    <h2 className='text-xs bg-blue-100 p-1 rounded-full px-2 text-primary'>
                        {doctor?.attributes?.categories?.data?.[0]?.attributes?.Name || 'Category'}
                    </h2>

                    <div className='flex gap-3 justify-center md:justify-start'>
                        {socialMediaList.map((item, index) => (
                            <a href={item.url || '#'} key={index} target="_blank" rel="noopener noreferrer">
                                <Image
                                    src={item.icon}
                                    width={30}
                                    height={30}
                                    alt={`social-media-icon-${index}`}
                                />
                            </a>
                        ))}
                    </div>

                    {/* Book Appointment Button */}
                    <div className="w-full flex justify-center md:justify-start">
                        <BookAppointment doctor={doctor} />
                    </div>
                </div>
            </div>

            {/* About Doctor Section */}
            <div className='p-3 border rounded-lg mt-5'>
                <h2 className='font-bold text-[20px]'>About Me</h2>
                <p className='text-gray-500 tracking-wide mt-2'>
                    {typeof doctor?.attributes?.About?.[0]?.children?.[0]?.text === 'string' ? doctor?.attributes?.About?.[0]?.children?.[0]?.text : 'No information available.'}
                </p>
            </div>
        </div>
    );
}

export default DoctorDetail;
