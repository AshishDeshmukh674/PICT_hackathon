// components/map.jsx

"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import L from "leaflet";

// Example JSON data
const clinicData = {
  doctors: [
    {
      name: "Dr. Shreepad Bhat",
      clinics: [
        {
          header: "Ratnamukund Healthcare Foundation",
          timings: ["8:00 AM - 9:00 AM", "9:30 AM - 10:30 AM"],
          location: "Sai Syaji Bus Stop, Warje",
          lat: 18.491150364175127,
          lng: 73.79292905356807,
        },
        {
          header: "Shreeyog Clinic",
          timings: ["6:30 PM - 7:30 PM", "8:00 PM - 9:30 PM"],
          location:
            "Flat 101, Laxmikrupa Apartment, Behind Sujata Mastani, Sinhgad Road, Opposite Ranka Jewellery, Hingne Khurd, Pune, Maharashtra, 411051",
          lat: 18.4822498767189,
          lng: 73.8271809834951,
        },
        {
          header: "Shashwat Hospital",
          timings: ["9:00 AM - 11:00 AM"],
          location: "Pune",
          lat: 18.494876829755892,
          lng: 73.81358741108289,
        },
      ],
    },
  ],
};

// Flatten the clinic data
const clinicLocations = clinicData.doctors.flatMap((doctor) =>
  doctor.clinics.map((clinic) => ({
    name: `${clinic.header}`,
    lat: clinic.lat,
    lng: clinic.lng,
    timings: clinic.timings.join(", "),
  }))
);

const MapComponent = () => {
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentPosition([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      });
    }
  }, []);

  const SetViewToShowAllMarkers = () => {
    const map = useMap();
    
    useEffect(() => {
      if (clinicLocations.length > 0) {
        const bounds = clinicLocations.map(clinic => [clinic.lat, clinic.lng]);
        if (currentPosition) {
          bounds.push(currentPosition);
        }
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [map]); // Removed `currentPosition` from the dependencies
  
    return null;
  };

  const handleGetDirections = (clinic) => {
    if (typeof window !== "undefined" && currentPosition) {
      const origin = `${currentPosition[0]},${currentPosition[1]}`;
      const destination = `${clinic.lat},${clinic.lng}`;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      window.open(googleMapsUrl, "_blank");
    } else {
      alert("Current position not available. Please allow location access.");
    }
  };

  // Use a custom PNG image for the marker icon
  const customMarkerIcon = new L.Icon({
    iconUrl: "/gps.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: null,
  });

  return (
    <MapContainer
      center={[18.5204, 73.8567]}
      zoom={13}
      style={{ height: "600px", width: "100%", position: "relative", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // Optionally, you can add layers here that remove POIs like clinics
        detectRetina={true} // Improves map quality on high DPI screens
      />

      {currentPosition && (
        <Marker position={currentPosition}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {clinicLocations.map((clinic, index) => (
        <Marker key={index} position={[clinic.lat, clinic.lng]} icon={customMarkerIcon}>
          <Popup>
            <strong>{clinic.name}</strong>
            <br />
            Timings: {clinic.timings}
            <br />
            <button onClick={() => handleGetDirections(clinic)} className="text-red-600 font-bold">
              Get Directions
            </button>
          </Popup>
        </Marker>
      ))}

      <SetViewToShowAllMarkers />
    </MapContainer>
  );
};

export default MapComponent;