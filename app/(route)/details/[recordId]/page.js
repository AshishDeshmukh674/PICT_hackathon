"use client";

import React, { useEffect, useState } from 'react';
import GlobalApi from '../../../_utils/GlobalApi';
import Image from 'next/image';
import { Youtube, Linkedin, Twitter, Facebook } from 'lucide-react';
import BookAppointment from './_components/BookAppointment';
import DoctorDetail from '/app/(route)/details/[recordId]/_components/DoctorDetail.jsx';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../../../config/FirebaseConfig';

function DoctorDetails({ params }) {
  const [doctor, setDoctor] = useState(null);
  const recordId = React.use(params).recordId;
  const db = getFirestore(app);

  useEffect(() => {
    getDoctorById();
  }, []);

  const getDoctorById = async () => {
    try {
      const resp = await GlobalApi.getDoctorById(recordId);
      const doctorData = resp.data.data;
      setDoctor(doctorData);
      
      // Save doctor data to Firebase
      try {
        await setDoc(doc(db, "Doctors", recordId), {
          id: doctorData.id,
          name: doctorData.attributes.Name,
          profession: doctorData.attributes.Profession,
          experience: doctorData.attributes.Year_of_Experience,
          areaOfExperience: doctorData.attributes.Area_Of_Experience,
          address: doctorData.attributes.Address,
          category: doctorData.attributes?.categories?.data?.[0]?.attributes?.Name || 'General',
          imageUrl: doctorData.attributes?.Image?.data?.[0]?.attributes?.url || '',
          createdAt: new Date().toISOString()
        });
      } catch (firebaseError) {
        console.error("Failed to save doctor to Firebase:", firebaseError);
      }
    } catch (error) {
      console.error("Failed to fetch doctor details:", error);
    }
  };

  return (
    <div className='p-5 md:px-20'>
      <h2 className='font-bold text-[22px]'>Details</h2>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-5'>
        {/* Doctor Details */}
        <div className='col-span-3'>
          {doctor ? (
            <DoctorDetail doctor={doctor} />
          ) : (
            <p>Loading doctor details...</p>
          )}
        </div>
        <div>
          {/* Additional details or components can go here */}
        </div>
      </div>
    </div>
  );
}

export default DoctorDetails;


