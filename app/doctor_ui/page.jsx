// Original Code
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const DoctorAppointments = () => {
  const [loggedInDoctor, setLoggedInDoctor] = useState(""); // To store the logged-in doctor's name
  const [appointments, setAppointments] = useState([]); // To store filtered appointments
  const [loading, setLoading] = useState(true); // To show loading state
  const [file, setFile] = useState(null); // To store selected file for upload
  const [uploading, setUploading] = useState(false); // To show uploading state

  // Fetch doctor's name from localStorage when the component mounts
  useEffect(() => {
    const loggedDoctor = JSON.parse(localStorage.getItem("loggedDoctor"));
    if (loggedDoctor && loggedDoctor.name) {
      setLoggedInDoctor(loggedDoctor.name);
    }
  }, []);

  // Fetch appointments from the API and filter based on logged-in doctor's name
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get("http://localhost:1337/api/appointments?populate=*");

        const allAppointments = response.data.data;

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to 00:00:00

        // Filter appointments
        const filtered = allAppointments.filter((appointment) => {
          const doctorName = appointment.attributes?.doctor?.data?.attributes?.Name || "";
          const appointmentDate = new Date(appointment.attributes.Date);

          // Allow only today's and future appointments for non-"X-ray" doctors
          if (doctorName === "X-ray") {
            return doctorName === loggedInDoctor; // Show all appointments for "X-ray"
          } else {
            return (
              doctorName === loggedInDoctor && 
              appointmentDate >= today // Show only today's and future appointments
            );
          }
        });

        setAppointments(filtered);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setLoading(false);
      }
    };

    if (loggedInDoctor) fetchAppointments();
  }, [loggedInDoctor]); // Run when loggedInDoctor changes

  // Handle file input change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload document for a specific appointment
  const handleFileUpload = async (appointmentId, patientEmail) => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("files", file);

    try {
      // Step 1: Upload the file to Strapi's Media Library
      const uploadResponse = await axios.post("http://localhost:1337/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadResponse.data && uploadResponse.data[0]) {
        // Step 2: Get the uploaded file ID
        const fileId = uploadResponse.data[0].id;

        // Step 3: Fetch all appointments with the same email
        const appointmentsResponse = await axios.get(
          `http://localhost:1337/api/appointments?filters[Email][$eq]=${patientEmail}&populate=*`
        );
        const matchingAppointments = appointmentsResponse.data.data;

        // Step 4: Update all matching appointments with the uploaded document
        const updatePromises = matchingAppointments.map((appointment) =>
          axios.put(`http://localhost:1337/api/appointments/${appointment.id}`, {
            data: {
              document: fileId,
            },
          })
        );

        await Promise.all(updatePromises);

        alert("File uploaded successfully to all relevant appointments!");
        setUploading(false);
        setFile(null); // Reset the file input after successful upload

        // Step 5: Refresh the appointments state
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            matchingAppointments.find((match) => match.id === appointment.id)
              ? {
                  ...appointment,
                  attributes: {
                    ...appointment.attributes,
                    document: uploadResponse.data[0],
                  },
                }
              : appointment
          )
        );
      } else {
        alert("Error uploading document.");
        setUploading(false);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading document.");
      setUploading(false);
    }
  };

  // Function to handle document download and display the image
  const handleDownload = async (appointment) => {
    const fileData = appointment.data;
    if (!fileData || fileData.length === 0) {
      console.error("Error: No file is uploaded.");
      alert("No file is uploaded.");
      return;
    }

    const fileUrl = fileData[0]?.attributes?.url;

    if (!fileUrl) {
      console.error("Error: File URL is not available.");
      alert("File URL is unavailable.");
      return;
    }

    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileUrl.split("/").pop(); // Use the filename from the URL or set a custom name
      document.body.appendChild(a); // Append the anchor to the document
      a.click(); // Trigger the download
      document.body.removeChild(a); // Remove the anchor after download

      window.URL.revokeObjectURL(blobUrl);
      console.log("File downloaded successfully: ", fileUrl);
    } catch (error) {
      console.error("Error downloading the file:", error);
      alert("Error downloading the document.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 space-y-10">
      {/* Appointments Table */}
      {loggedInDoctor && (
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h2 className="text-center text-2xl font-semibold">{loggedInDoctor}'s Appointments</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : appointments.length > 0 ? (
              <table className="min-w-full border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border-b px-4 py-2 font-semibold text-center">ID</th>
                    <th className="border-b px-4 py-2 font-semibold text-center">Patient Name</th>
                    <th className="border-b px-4 py-2 font-semibold text-center">Date</th>
                    <th className="border-b px-4 py-2 font-semibold text-center">Time</th>
                    <th className="border-b px-4 py-2 font-semibold text-center">Document</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-100">
                      <td className="border-b px-4 py-2 text-center">{appointment.id}</td>
                      <td className="border-b px-4 py-2 text-center">
                        {appointment.attributes.UserName || "N/A"}
                      </td>
                      <td className="border-b px-4 py-2 text-center">{appointment.attributes.Date}</td>
                      <td className="border-b px-4 py-2 text-center">{appointment.attributes.Time}</td>
                      <td className="border-b px-4 py-2 text-center">
                        {loggedInDoctor === "X-ray" ? (
                          <div>
                            <input
                              type="file"
                              onChange={handleFileChange}
                              disabled={uploading}
                              className="mt-2"
                            />
                            <button
                              onClick={() => handleFileUpload(appointment.id, appointment.attributes.Email)}
                              className="w-full mt-2 bg-green-500 text-white py-1 rounded-md"
                              disabled={uploading || !file}
                            >
                              {uploading ? "Uploading..." : "Upload Document"}
                            </button>
                          </div>
                        ) : appointment.attributes.document ? (
                          <button
                            onClick={() => handleDownload(appointment.attributes.document)}
                            className="text-blue-600"
                          >
                            Download Document
                          </button>
                        ) : (
                          <span>No document available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-gray-500">
                No appointments found for {loggedInDoctor}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;


