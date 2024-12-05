"use client";

import { useEffect, useState } from "react";
import axios from "axios"; // Ensure axios is installed
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";

export default function DoctorUI() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localChanges, setLocalChanges] = useState({}); // Track unsaved changes locally
  const [savedStatus, setSavedStatus] = useState({}); // Track save status for each appointment

  // Fetch appointments from Strapi
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get("http://localhost:1337/api/appointments?populate=*");
        setAppointments(response.data.data); // Strapi stores data under `data`
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Handle checkbox toggle (local state only)
  const handleCheck = (appointmentId, currentStatus) => {
    setLocalChanges((prev) => ({
      ...prev,
      [appointmentId]: !currentStatus, // Toggle the checked status locally
    }));

    // When checkbox is toggled, mark the changes as unsaved and reset saved status
    setSavedStatus((prevStatus) => ({
      ...prevStatus,
      [appointmentId]: false, // Reset save status (button turns green)
    }));
  };

  // Save changes for a specific appointment
  const saveChanges = async (appointmentId) => {
    const checkedStatus = localChanges[appointmentId];

    if (checkedStatus !== undefined) {
      try {
        await axios.put(`http://localhost:1337/api/appointments/${appointmentId}`, {
          data: {
            checked: checkedStatus,
          },
        });

        // Reflect the saved changes in the main state
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === appointmentId
              ? {
                  ...appointment,
                  attributes: {
                    ...appointment.attributes,
                    checked: checkedStatus,
                  },
                }
              : appointment
          )
        );

        // Mark the appointment as saved
        setSavedStatus((prevStatus) => ({
          ...prevStatus,
          [appointmentId]: true,
        }));

        // Remove the local change after saving
        setLocalChanges((prev) => {
          const updatedChanges = { ...prev };
          delete updatedChanges[appointmentId];
          return updatedChanges;
        });

        alert(`Changes for Appointment ID ${appointmentId} saved successfully!`);
      } catch (error) {
        console.error("Error saving changes:", error);
        alert("Failed to save changes. Please try again.");
      }
    }
  };

  // Group appointments by doctor
  const groupedByDoctor = appointments.reduce((acc, appointment) => {
    const doctorName = appointment.attributes.doctor.data
      ? appointment.attributes.doctor.data.attributes.Name
      : "No Doctor Assigned";

    if (!acc[doctorName]) {
      acc[doctorName] = [];
    }

    acc[doctorName].push(appointment);
    return acc;
  }, {});

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 space-y-10">
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : Object.keys(groupedByDoctor).length > 0 ? (
        <>
          {Object.keys(groupedByDoctor).map((doctorName) => (
            <Card key={doctorName} className="w-full max-w-4xl bg-white shadow-lg rounded-lg">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="text-center">{doctorName}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="min-w-full border-collapse table-auto">
                  {/* Table Header */}
                  <TableHead>
                    <TableRow className="bg-gray-200">
                      <TableCell className="border-b px-4 py-2 font-semibold text-center">ID</TableCell>
                      <TableCell className="border-b px-4 py-2 font-semibold text-center">Patient Name</TableCell>
                      <TableCell className="border-b px-4 py-2 font-semibold text-center">Date</TableCell>
                      <TableCell className="border-b px-4 py-2 font-semibold text-center">Time</TableCell>
                      <TableCell className="border-b px-4 py-2 font-semibold text-center">Doctor</TableCell>
                      <TableCell className="border-b px-4 py-2 font-semibold text-center">Checkup Done</TableCell>
                      <TableCell className="border-b px-4 py-2 font-semibold text-center">Save Changes</TableCell>
                      <TableCell className="border-b px-4 py-2 font-semibold text-center">Document</TableCell>
                    </TableRow>
                  </TableHead>

                  {/* Table Body */}
                  <TableBody>
                    {groupedByDoctor[doctorName].map((appointment) => (
                      <TableRow key={appointment.id} className="hover:bg-gray-100">
                        <TableCell className="border-b px-4 py-2 text-center">{appointment.id}</TableCell>
                        <TableCell className="border-b px-4 py-2 text-center">{appointment.attributes.UserName}</TableCell>
                        <TableCell className="border-b px-4 py-2 text-center">{appointment.attributes.Date}</TableCell>
                        <TableCell className="border-b px-4 py-2 text-center">{appointment.attributes.Time}</TableCell>
                        <TableCell className="border-b px-4 py-2 text-center">{doctorName}</TableCell>
                        <TableCell className="border-b px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={
                              localChanges[appointment.id] !== undefined
                                ? localChanges[appointment.id]
                                : appointment.attributes.checked || false
                            }
                            onChange={() =>
                              handleCheck(
                                appointment.id,
                                localChanges[appointment.id] !== undefined
                                  ? localChanges[appointment.id]
                                  : appointment.attributes.checked || false
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="border-b px-4 py-2 text-center">
                          <Button
                            onClick={() => saveChanges(appointment.id)}
                            className={`px-2 py-1 rounded ${
                              savedStatus[appointment.id] ? "bg-orange-500" : "bg-green-600"
                            } text-white`}
                          >
                            {savedStatus[appointment.id] ? "Saved" : "Save"}
                          </Button>
                        </TableCell>
                        <TableCell className="border-b px-4 py-2 text-center">
                          {appointment.attributes.document ? (
                            <a
                              href={`http://localhost:1337${appointment.attributes.document.url}`} // Assuming document URL is available in Strapi response
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              Open/Download
                            </a>
                          ) : (
                            <span>null</span>  
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        <div className="text-center text-gray-500">No appointments found.</div>
      )}
    </div>
  );
}
