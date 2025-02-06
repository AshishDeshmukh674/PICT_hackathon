import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_STRAPI_API_KEY;

const axiosClient = axios.create({
    baseURL: 'https://appointment-booking-strapi.onrender.com/api',
    // baseURL:'http://127.0.0.1:1337/api',
    headers: {
        'Authorization': `Bearer ${API_KEY}`
    }
});

// Fetch all categories with their relationships populated
const getCategory = () => axiosClient.get('categories?populate=*');

// Fetch all doctors with their relationships populated
const getDoctorList = () => axiosClient.get('doctors?populate=*');

// Fetch doctors by category name with their relationships populated
const getDoctorByCategory = (category) => 
    axiosClient.get(`/doctors?filters[categories][Name][$in]=${category}&populate=*`);

// Fetch doctor details by ID with relationships populated
const getDoctorById = (id) => 
    axiosClient.get(`/doctors/${id}?populate=*`);

// Fetch user booking list by user email with populated relationships
const getUserBookingList = (userEmail) => 
    axiosClient.get(`/appointments?filters[Email][$eq]=${userEmail}&populate[doctor][populate][Image][populate][0]=url&populate=*`);

// Book an appointment
const bookAppointment = (data) => {
    // If symptoms exist in localStorage, add them to the appointment data
    const symptoms = localStorage.getItem('currentSymptoms');
    if (symptoms) {
        data.data.symp = symptoms;
        localStorage.removeItem('currentSymptoms'); // Clear after using
    }
    return axiosClient.post('/appointments', data);
};

// Fetch appointments for a specific doctor and date
const getDoctorAppointmentsByDate = (doctorId, date) => 
    axiosClient.get(`/appointments?filters[doctor]=${doctorId}&filters[Date][$eq]=${date}`);

// Cancel an appointment by ID
const cancelAppointment = (id) => 
    axiosClient.delete(`/appointments/${id}`);

// Fetch campaigns
const getCampaigns = () => axiosClient.get('/campaigns?populate=*');

// Fetch galleries
const getGallery = () => axiosClient.get('/galleries?populate=*');

// Add this new function in the GlobalApi.jsx file
const getAppointmentsByName = (doctorName) => 
    axiosClient.get(`/appointments?populate=*&filters[doctor][Name][$eq]=${doctorName}`);

// Add these new functions
const saveSymptoms = (email, symptoms) => 
    axiosClient.post('/patient-symptoms', {
        data: {
            email: email,
            symptoms: symptoms
        }
    });

const getSymptomsByEmail = (email) => 
    axiosClient.get(`/patient-symptoms?filters[email][$eq]=${email}&sort[0]=createdAt:desc`);

// Add this new function to update appointment with symptoms
const updateAppointmentSymptoms = (appointmentId, symptoms) => 
    axiosClient.put(`/appointments/${appointmentId}`, {
        data: {
            symp: symptoms
        }
    });

// Modify the cancelAppointmentByEmailDate function
const cancelAppointmentByEmailDate = (email, date) => {
    // Convert date from DD/MM/YYYY to YYYY-MM-DD format
    const [day, month, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Use the email exactly as received, only encode for URL
    const encodedEmail = encodeURIComponent(email);
    
    console.log('Cancellation Request:', {
        originalEmail: email,
        encodedEmail: encodedEmail,
        originalDate: date,
        formattedDate: formattedDate,
        url: `/appointments?filters[Email][$eq]=${encodedEmail}&filters[Date][$eq]=${formattedDate}`
    });

    return axiosClient.get(`/appointments?filters[Email][$eq]=${encodedEmail}&filters[Date][$eq]=${formattedDate}`)
        .then(async (response) => {
            console.log('API Response:', {
                status: response.status,
                data: response.data,
                appointments: response.data.data,
                filters: {
                    email: email, // Use original email
                    date: formattedDate
                }
            });

            const appointments = response.data.data;
            
            // Log each appointment for debugging
            appointments.forEach(app => {
                console.log('Found Appointment:', {
                    id: app.id,
                    email: app.attributes.Email,
                    date: app.attributes.Date,
                    exactMatch: app.attributes.Email === email && app.attributes.Date === formattedDate
                });
            });

            if (appointments.length === 0) {
                throw new Error('No appointment found for this email and date');
            }
            
            // Delete all appointments matching the email and date
            const deletePromises = appointments.map(appointment => {
                console.log('Attempting to delete appointment:', {
                    id: appointment.id,
                    email: appointment.attributes.Email,
                    date: appointment.attributes.Date
                });
                return axiosClient.delete(`/appointments/${appointment.id}`);
            });
            
            return Promise.all(deletePromises);
        })
        .catch(error => {
            console.error('Cancellation Error Details:', {
                error: error.message,
                response: error.response?.data,
                requestDetails: {
                    email: email,
                    encodedEmail: encodedEmail,
                    originalDate: date,
                    formattedDate,
                }
            });
            throw error;
        });
};

// Exported API methods
export default {
    getCategory,
    getDoctorList,
    getDoctorByCategory,
    getDoctorById,
    bookAppointment,
    getUserBookingList,
    getDoctorAppointmentsByDate,
    cancelAppointment,
    getCampaigns,
    getGallery,
    getAppointmentsByName,
    saveSymptoms,
    getSymptomsByEmail,
    updateAppointmentSymptoms,
    cancelAppointmentByEmailDate,
};
