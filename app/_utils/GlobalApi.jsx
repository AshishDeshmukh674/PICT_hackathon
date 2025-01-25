// import axios from 'axios';

// const API_KEY = process.env.NEXT_PUBLIC_STRAPI_API_KEY;

// const axiosClient = axios.create({
//     baseURL: 'https://appointment-booking-strapi.onrender.com/api',
//     // baseURL:'http://localhost:1337/api',
//     headers: {
//         'Authorization': `Bearer ${API_KEY}`
//     }
// });

// // Fetch all categories with their relationships populated
// const getCategory = () => axiosClient.get('categories?populate=*');

// // Fetch all doctors with their relationships populated
// const getDoctorList = () => axiosClient.get('doctors?populate=*');

// // Fetch doctors by category name with their relationships populated
// const getDoctorByCategory = (category) => 
//     axiosClient.get(`/doctors?filters[categories][Name][$in]=${category}&populate=*`);

// // Fetch doctor details by ID with relationships populated
// const getDoctorById = (id) => 
//     axiosClient.get(`/doctors/${id}?populate=*`);

// // Fetch user booking list by user email with populated relationships
// const getUserBookingList = (userEmail) => 
//     axiosClient.get(`/appointments?filters[Email][$eq]=${userEmail}&populate[doctor][populate][Image][populate][0]=url&populate=*`);

// // Book an appointment
// const bookAppointment = (data) => 
//     axiosClient.post('/appointments', data);

// // Fetch appointments for a specific doctor and date
// const getDoctorAppointmentsByDate = (doctorId, date) => 
//     axiosClient.get(`/appointments?filters[doctor]=${doctorId}&filters[Date][$eq]=${date}`);

// // Cancel an appointment by ID
// const cancelAppointment = (id) => 
//     axiosClient.delete(`/appointments/${id}`);

// const getCampaigns = () => axiosClient.get('/campaigns?populate=*');

// const getGallery = () => axiosClient.get('/galleries?populate=*');


// const GlobalApi = {
//     getDoctorList: async () => {
//       try {
//         const response = await axios.get("http://localhost:1337/api/doctors");
//         return response;
//       } catch (error) {
//         console.error("Error fetching doctor list", error);
//       }
//     },
//   };

// // Exported API methods
// export default {
//     getCategory,
//     getDoctorList,
//     getDoctorByCategory,
//     getDoctorById,
//     bookAppointment,
//     getUserBookingList,
//     getDoctorAppointmentsByDate,
//     cancelAppointment,
//     getCampaigns,
//     getGallery,
//     GlobalApi,
// };



import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_STRAPI_API_KEY;

const axiosClient = axios.create({
    // baseURL: 'https://appointment-booking-strapi.onrender.com/api',
    // baseURL:'http://localhost:1337/api',
    baseURL:'https://pict-strapi-jw5e.onrender.com/api',
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
const bookAppointment = (data) => 
    axiosClient.post('/appointments', data);

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
};
