"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import GlobalApi from "../../app/_utils/GlobalApi";

function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState("left");
  const animationDuration = 1000; // 1 second for each slide transition

  useEffect(() => {
    GlobalApi.getGallery()
      .then((response) => {
        setPhotos(response.data.data);
        console.log(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching Gallery: ", error);
      });
  }, []);

  useEffect(() => {
    if (photos.length > 0) {
      const interval = setInterval(() => {
        if (!isAnimating) {
          setSlideDirection("left");
          goToSlide(currentSlide + 1);
        }
      }, 2000); // Change image every 2 seconds

      return () => clearInterval(interval);
    }
  }, [photos, currentSlide, isAnimating]);

  const preventClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  };

  const goToSlide = (index) => {
    preventClick();
    if (index >= photos.length) {
      index = 0;
    } else if (index < 0) {
      index = photos.length - 1;
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
    photos.length > 0 && (
      <div className="gallery-section relative w-full mb-10">
       {/* Adjusting the heading's margin and adding an underline */}
<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 lg:mb-6 underline underline-offset-4 decoration-4 decoration-black text-blue-700">
  Gallery
</h2>


        {/* Responsive slideshow container */}
        <div className="relative w-full max-w-7xl h-[400px] md:h-[500px] lg:h-[700px] overflow-hidden rounded-lg mb-6 mx-auto">
          <div className={`relative w-full h-full flex transition-transform duration-${animationDuration} ease-in-out ${slideDirection}`}>
            {photos.map((photo, i) => (
              <div
                key={i}
                className={`flex-shrink-0 w-full h-full ${currentSlide === i ? "opacity-100" : "opacity-0"}`}
              >
                {/* Responsive image */}
                <Image
                  src={photo?.attributes?.Photo?.data?.attributes?.url || "/default-image.jpg"}
                  alt={`Photo ${i + 1}`}
                  layout="fill"
                  objectFit="contain"
                  className="transition-opacity duration-1000"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Responsive pagination dots */}
        {photos.length > 1 && (
          <div className="pagination mt-4 md:mt-5 lg:mt-6 flex justify-center gap-2">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`cursor-pointer p-2 rounded-full ${currentSlide === i ? "bg-primary" : "bg-gray-300"}`}
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

export default Gallery;
