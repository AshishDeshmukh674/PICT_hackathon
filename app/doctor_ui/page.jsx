"use client";

import { useEffect, useState } from "react";
import axios from "axios"; // Ensure axios is installed
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "../../components/ui/table";

export default function DoctorUI() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Function to handle checkbox toggle
  const handleCheck = async (appointmentId, currentStatus) => {
    try {
      // Update the `checked` field in Strapi
      await axios.put(`http://localhost:1337/api/appointments/${appointmentId}`, {
        data: {
          checked: !currentStatus, // Toggle the status
        },
      });

      // Update the local state
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                attributes: {
                  ...appointment.attributes,
                  checked: !currentStatus, // Update status locally
                },
              }
            : appointment
        )
      );
    } catch (error) {
      console.error("Error updating appointment status:", error);
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
        Object.keys(groupedByDoctor).map((doctorName) => (
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
                          checked={appointment.attributes.checked || false} // Default to false if undefined
                          onChange={() => handleCheck(appointment.id, appointment.attributes.checked || false)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center text-gray-500">No appointments found.</div>
      )}
    </div>
  );
}
