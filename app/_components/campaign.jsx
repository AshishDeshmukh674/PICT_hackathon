"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AiOutlineArrowRight, AiOutlineArrowLeft } from "react-icons/ai";
import GlobalApi from "../../app/_utils/GlobalApi";

function CampaignSection() {
  const [campaigns, setCampaigns] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState("left");
  const animationDuration = 1000; // 1 second for each slide transition

  useEffect(() => {
    GlobalApi.getCampaigns()
      .then((response) => {
        setCampaigns(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching campaigns: ", error);
      });
  }, []);

  useEffect(() => {
    if (campaigns.length > 0) {
      const interval = setInterval(() => {
        if (!isAnimating) {
          setSlideDirection("left");
          goToSlide(currentSlide + 1);
        }
      }, 2000); // Change image every 2 seconds

      return () => clearInterval(interval);
    }
  }, [campaigns, currentSlide, isAnimating]);

  const preventClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  };

  const goToSlide = (index) => {
    preventClick();
    if (index >= campaigns.length) {
      index = 0;
    } else if (index < 0) {
      index = campaigns.length - 1;
    }
    setSlideDirection(currentSlide < index ? "left" : "right");
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setSlideDirection("left");
    goToSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    setSlideDirection("right");
    goToSlide(currentSlide - 1);
  };

  return (
    campaigns.length > 0 && (
       
      <div className="campaign-section relative w-full mb-10">
        <h2 className="text-6xl font-bold text-center mb-6 underline underline-offset-4 decoration-4 decoration-black text-blue-700">Campaign</h2>
        <div className="relative w-[90%] max-w-3xl h-80 overflow-hidden rounded-lg shadow-lg mb-6 mx-auto">
          <div className={`relative w-full h-full flex transition-transform duration-${animationDuration} ease-in-out ${slideDirection}`}>
            {campaigns.map((campaign, i) => (
              <div
                key={i}
                className={`flex-shrink-0 w-full h-full ${currentSlide === i ? "opacity-100" : "opacity-0"}`}
              >
                <Image
                  src={campaign.attributes?.Poster?.data?.attributes?.url || "/default-image.jpg"}
                  alt={`Campaign Image ${i + 1}`}
                  layout="fill"
                  objectFit="contain"
                  className="transition-opacity duration-1000"
                />
              </div>
            ))}
          </div>

          {/* Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition duration-300 ease-in-out z-10"
          >
            <AiOutlineArrowLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition duration-300 ease-in-out z-10"
          >
            <AiOutlineArrowRight size={20} />
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">
            {campaigns[currentSlide].attributes.Details}
          </h2>
          <p className="text-lg text-gray-600 mb-1">
            Start Date: {new Date(campaigns[currentSlide].attributes.Start_date).toLocaleDateString()}
          </p>
          <p className="text-lg text-gray-600 mb-4">
            End Date: {new Date(campaigns[currentSlide].attributes.End_Date).toLocaleDateString()}
          </p>
          <Link href={campaigns[currentSlide].attributes.Link}>
            <button className="bg-primary text-white py-2 px-4 rounded-full hover:bg-primary-dark transition duration-300 ease-in-out">
              Join Group
            </button>
          </Link>
        </div>

        {campaigns.length > 1 && (
          <div className="pagination mt-6 flex justify-center gap-2">
            {campaigns.map((_, i) => (
              <span
                key={i}
                className={`cursor-pointer p-2 rounded-full ${
                  currentSlide === i ? "bg-primary" : "bg-gray-300"
                }`}
                onClick={() => goToSlide(i)}
              >
                <span className="sr-only">{`Slide ${i + 1}`}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  );
}

export default CampaignSection;
