"use client"
import {useEffect,useState} from "react"
// import Image from "next/image";
import Hero from "./_components/Hero"
import CategorySearch from "./_components/CategorySearch";
import DoctorList from "./_components/DoctorList"
import GlobalApi from "./_utils/GlobalApi";
import Contact from "./_components/Contact";
import Timings from "./_components/Timings";
import dynamic from 'next/dynamic';
import Campaign from './_components/campaign'
import Gallery from './_components/Gallery'
import DoctorLogin from "./_components/doctorLogin"; // Correct path for DoctorLogin
import ChatBot from '../app/components/ChatBot';

// Dynamically import MapComponent with server-side rendering disabled
const MapComponent = dynamic(() => import('./_components/map'), { ssr: false });
export default function Home() {

const [doctorList,setDoctorList]=useState( []);
const [isChatbotOpen, setIsChatbotOpen] = useState(false);

useEffect(()=>{
  getDoctorList();
},[])

  const getDoctorList=()=>{
    GlobalApi.getDoctorList().then(resp=>{
      console.log(resp.data.data);
      setDoctorList(resp.data.data)
    })
  }
  return (
    <>
    {/* <div>
    <DoctorLogin/>
    </div> */}
      <div>
        
        <Hero/>
        <CategorySearch/>
        <DoctorList doctorList={doctorList}/>
      </div>
      <div className="mt-20">
        <Gallery/>
      </div>
      <div className="mt-20">
        <Campaign/>
      </div>
      <div id="main-container" className="main-container">
      <div id="contact-card" className="card-container">
          <h1 id="contact-header" className="header-text">Contact Us</h1>
          <Contact />
      </div>
      <div id="timings-card" className="timings-container">
          <Timings />
      </div>
      </div>
      <div className="relative">
        <div id="map-container" className="map-container relative z-0">
          <MapComponent />
        </div>
        <div className="fixed bottom-20 right-4 z-[1000]">
          <ChatBot 
            isOpen={isChatbotOpen} 
            onClose={() => setIsChatbotOpen(false)}
            onOpen={() => setIsChatbotOpen(true)}
          />
        </div>
      </div>
    </>
  );
}
