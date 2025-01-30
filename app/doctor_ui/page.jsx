"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import GlobalApi from "../_utils/GlobalApi";

const DoctorAppointments = () => {
  const [loggedInDoctor, setLoggedInDoctor] = useState(""); // To store the logged-in doctor's name
  const [appointments, setAppointments] = useState([]); // To store filtered appointments
  const [loading, setLoading] = useState(true); // To show loading state
  const [file, setFile] = useState(null); // To store selected file for upload
  const [uploading, setUploading] = useState(false); // To show uploading state
  const [previewUrl, setPreviewUrl] = useState(null); // To store file preview URL
  const [patientSymptoms, setPatientSymptoms] = useState({});

  // Fetch doctor's name from localStorage when the component mounts
  useEffect(() => {
    const loggedDoctor = JSON.parse(localStorage.getItem("loggedDoctor"));
    if (loggedDoctor && loggedDoctor.name) {
      setLoggedInDoctor(loggedDoctor.name);
    }
  }, []);

  // Fetch symptoms for each appointment
  const fetchPatientSymptoms = async (email) => {
    try {
      const response = await GlobalApi.getSymptomsByEmail(email);
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0].attributes.symptoms;
      }
      return null;
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      return null;
    }
  };

  // Fetch appointments from the API and filter based on logged-in doctor's name
  useEffect(() => {
    const fetchAppointmentsAndSymptoms = async () => {
      try {
        const response = await GlobalApi.getAppointmentsByName(loggedInDoctor);
        const allAppointments = response.data.data;

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter appointments based on doctor type
        const filtered = allAppointments.filter((appointment) => {
          const appointmentDate = new Date(appointment.attributes.Date);
          const appointmentDateObj = new Date(appointmentDate.setHours(0, 0, 0, 0));
          const todayObj = new Date(today);
          todayObj.setHours(0, 0, 0, 0);

          // For X-ray, show all appointments
          if (loggedInDoctor === "X-ray") {
            return true;
          }
          // For other doctors, show only today's and future appointments
          return appointmentDateObj >= todayObj;
        });

        // Sort appointments by date (newest first)
        const sortedAppointments = filtered.sort((a, b) => {
          const dateA = new Date(a.attributes.Date);
          const dateB = new Date(b.attributes.Date);
          return dateB - dateA;
        });

        console.log('Logged in doctor:', loggedInDoctor);
        console.log('Filtered appointments:', sortedAppointments);
        setAppointments(sortedAppointments);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    if (loggedInDoctor) fetchAppointmentsAndSymptoms();
  }, [loggedInDoctor]);

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
        const updatePromises = matchingAppointments.map(async (appointment) => {
          // First get the current documents
          const currentDocs = appointment.attributes.document?.data || [];
          
          // Create an array of existing document IDs
          const existingDocIds = currentDocs.map(doc => doc.id);
          
          // Add the new document ID to the array
          const updatedDocIds = [...existingDocIds, fileId];

          // Update the appointment with all document IDs
          return axios.put(`http://localhost:1337/api/appointments/${appointment.id}`, {
            data: {
              document: updatedDocIds
            },
          });
        });

        await Promise.all(updatePromises);

        alert("File uploaded successfully to all relevant appointments!");
        setUploading(false);
        setFile(null); // Reset the file input after successful upload

        // Step 5: Refresh the appointments state
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) => {
            const matchingAppointment = matchingAppointments.find((match) => match.id === appointment.id);
            if (matchingAppointment) {
              const currentDocs = appointment.attributes.document?.data || [];
              return {
                ...appointment,
                attributes: {
                  ...appointment.attributes,
                  document: {
                    data: [...currentDocs, uploadResponse.data[0]]
                  }
                },
              };
            }
            return appointment;
          })
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

  // Modify the handleDownload function to handle multiple documents
  const handleDownload = async (documentData) => {
    const files = documentData?.data;
    if (!files || files.length === 0) {
      console.error("Error: No files are uploaded.");
      alert("No files are uploaded.");
      return;
    }

    try {
      // Download all files
      for (const file of files) {
        const fileUrl = file?.attributes?.url;
        if (!fileUrl) {
          console.error("Error: File URL is not available for one of the files.");
          continue;
        }

        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const downloadLink = window.document.createElement("a");
        downloadLink.href = blobUrl;
        downloadLink.download = `${file.attributes.name || fileUrl.split("/").pop()}`;
        window.document.body.appendChild(downloadLink);
        downloadLink.click();
        window.document.body.removeChild(downloadLink);

        window.URL.revokeObjectURL(blobUrl);
        console.log("File downloaded successfully: ", fileUrl);

        // Add a small delay between downloads to prevent browser issues
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      alert("All documents downloaded successfully!");
    } catch (error) {
      console.error("Error downloading files:", error);
      alert("Error downloading documents.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 space-y-10">
      {/* Appointments Table */}
      {loggedInDoctor && (
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h2 className="text-center text-2xl font-semibold">{loggedInDoctor} s Appointments</h2>
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
                    {loggedInDoctor !== "X-ray" && (
                      <th className="border-b px-4 py-2 font-semibold text-center">Symptoms</th>
                    )}
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
                      {loggedInDoctor !== "X-ray" && (
                        <td className="border-b px-4 py-2 text-center">
                          {appointment.attributes.symp || "No symptoms recorded"}
                        </td>
                      )}
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
                        ) : appointment.attributes.document?.data ? (
                          <div>
                            <button
                              onClick={() => handleDownload(appointment.attributes.document)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Download Documents ({Array.isArray(appointment.attributes.document.data) ? 
                                appointment.attributes.document.data.length : 0})
                            </button>
                          </div>
                        ) : (
                          "No Documents"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-gray-500">No appointments found.</div>
            )}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-3xl w-full">
            <h3 className="text-xl font-semibold mb-4">Document Preview</h3>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-red-500 font-semibold"
              >
                Close
              </button>
            </div>
            <div className="flex justify-center">
              <iframe
                src={previewUrl}
                className="w-full h-96"
                title="Document Preview"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;