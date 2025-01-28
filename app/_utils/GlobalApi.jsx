import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_STRAPI_API_KEY;

const axiosClient = axios.create({
    // baseURL: 'https://appointment-booking-strapi.onrender.com/api',
    baseURL:'http://localhost:1337/api',
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
};
