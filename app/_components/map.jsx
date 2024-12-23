// // components/map.jsx

// "use client";

// import React, { useState, useEffect } from "react";
// import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
// import "leaflet-defaulticon-compatibility";
// import L from "leaflet";

// const MapComponent = () => {
//   const [currentPosition, setCurrentPosition] = useState(null);
//   const [isChatbotOpen, setIsChatbotOpen] = useState(false); // Track chatbot visibility

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       navigator.geolocation.getCurrentPosition((position) => {
//         setCurrentPosition([
//           position.coords.latitude,
//           position.coords.longitude,
//         ]);
//       });
//     }
//   }, []);

//   const handleChatbotToggle = () => {
//     setIsChatbotOpen(!isChatbotOpen);
//   };

//   const customMarkerIcon = new L.Icon({
//     iconUrl: "/gps.png",
//     iconSize: [32, 32],
//     iconAnchor: [16, 32],
//     popupAnchor: [0, -32],
//     shadowUrl: null,
//   });

//   return (
//     <div style={{ position: "relative" }}>
//       {/* Toggle button for chatbot */}
//       <button
//         onClick={handleChatbotToggle}
//         className="absolute z-20 top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md"
//       >
//         {isChatbotOpen ? "Close Chatbot" : "Open Chatbot"}
//       </button>

//       {/* Chatbot Box */}
//       {isChatbotOpen && (
//         <div
//           className="absolute top-20 right-4 z-30 bg-white shadow-lg rounded-md p-4 w-80"
//           style={{ opacity: 0.95 }}
//         >
//           <h3 className="font-bold text-lg mb-2">Chatbot</h3>
//           <p>How can I assist you?</p>
//         </div>
//       )}

//       {/* Map Container */}
//       <MapContainer
//         center={[18.5204, 73.8567]}
//         zoom={13}
//         style={{
//           height: "600px",
//           width: "100%",
//           opacity: isChatbotOpen ? 0.5 : 1, // Reduce opacity if chatbot is open
//           transition: "opacity 0.5s ease",
//           zIndex: 1, // Set lower z-index for the map
//         }}
//         className="leaflet-container"
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           detectRetina={true}
//         />
//         {currentPosition && (
//           <Marker position={currentPosition}>
//             <Popup>Your Location</Popup>
//           </Marker>
//         )}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapComponent;

