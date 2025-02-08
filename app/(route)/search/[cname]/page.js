"use client";
import DoctorList from '../../../../app/_components/DoctorList';
import GlobalApi from '../../../../app/_utils/GlobalApi';
import React, { useEffect, useState } from 'react';

function Search({ params }) {
  const [doctorList, setDoctorList] = useState([]);

  useEffect(() => {
    console.log(params.cname);
    getDoctors();
  }, [params.cname]);  // Ensure the effect runs whenever params.cname changes

  const getDoctors = async () => {
    try {
      // Correct the function name here
      const resp = await GlobalApi.getDoctorByCategory(params.cname); // <-- Corrected here
      console.log(resp.data.data);
      setDoctorList(resp.data.data);
      
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  };

  return (
    <div className='mt-5'>
      <DoctorList heading={params.cname} doctorList={doctorList} />
    </div>
  );
}

export default Search;
