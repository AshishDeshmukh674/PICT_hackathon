import axios from 'axios';

const API_KEY = "97e69d6de8026a7a98fbae297aa1e4659c1a24cd4457431bf8fb95be611797c093189cf3199a463e38d550a4d461dc31b3f324c4806740978549f20e7cdb952ebdcd5dd571905ae2d90ab66f405fbf7d75901a7ec8a8bf3475b7a4285526803caf52c59304c701de42fae5333f6624c21dd27b96bdedeb3a2b002fbfa2f03b3e";

const axiosClient = axios.create({
    baseURL: 'https://appointment-booking-strapi.onrender.com/api',
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

// Book an appointment with symptoms handling
const bookAppointment = (data) => {
    const appointmentData = {
        data: {
            Name: data.data.Name,
            Email: data.data.Email,
            Phone: data.data.Phone,
            Date: data.data.Date,
            Time: data.data.Time,
            doctor: data.data.doctor,
            symp: data.data.symp || "No symptoms provided",
            Type: data.data.Type || "In-Person"
        }
    };
    return axiosClient.post('/appointments', appointmentData);
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

// Get appointments by doctor name
const getAppointmentsByName = (doctorName) => 
    axiosClient.get(`/appointments?populate=*&filters[doctor][Name][$eq]=${doctorName}`);

// Save patient symptoms
const saveSymptoms = (email, symptoms) => 
    axiosClient.post('/patient-symptoms', {
        data: {
            email: email,
            symptoms: symptoms
        }
    });

// Get symptoms by email
const getSymptomsByEmail = (email) => 
    axiosClient.get(`/patient-symptoms?filters[email][$eq]=${email}&sort[0]=createdAt:desc`);

// Update appointment symptoms
const updateAppointmentSymptoms = (appointmentId, symptoms) => 
    axiosClient.put(`/appointments/${appointmentId}`, {
        data: {
            symp: symptoms
        }
    });

// Get appointments by email and date
const getAppointmentsByEmailAndDate = (email, date) => {
    const [day, month, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    const encodedEmail = encodeURIComponent(email);
    
    return axiosClient.get(`/appointments?filters[Email][$eq]=${encodedEmail}&filters[Date][$eq]=${formattedDate}`);
};

// Cancel appointment by email and date
const cancelAppointmentByEmailDate = (email, date) => {
    const [day, month, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    const encodedEmail = encodeURIComponent(email);
    
    return axiosClient.get(`/appointments?filters[Email][$eq]=${encodedEmail}&filters[Date][$eq]=${formattedDate}`)
        .then(async (response) => {
            const appointments = response.data.data;
            
            if (appointments.length === 0) {
                throw new Error('No appointment found for this email and date');
            }
            
            return Promise.all(appointments.map(appointment => 
                axiosClient.delete(`/appointments/${appointment.id}`)
            ));
        });
};

// Get available time slots for a doctor
const getAvailableTimeSlots = async (doctorId, date, clinicType) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    const response = await getDoctorAppointmentsByDate(doctorId, dateStr);
    const bookedSlots = response.data.data?.map(appointment => appointment.attributes.Time) || [];

    const clinicSlots = {
        'Morning Clinic': ['9:00 AM', '10:00 AM', '11:00 AM'],
        'Evening Clinic': ['4:00 PM', '5:00 PM', '6:00 PM'],
        'AfterNoon Clinic': ['2:00 PM', '3:00 PM', '4:00 PM']
    };

    const availableSlots = clinicSlots[clinicType]?.filter(slot => !bookedSlots.includes(slot)) || [];
    return availableSlots;
};

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
    getAppointmentsByEmailAndDate,
    getAvailableTimeSlots
};
