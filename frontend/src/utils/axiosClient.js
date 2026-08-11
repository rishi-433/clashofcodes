import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'https://clashofcodes-backend-6fwg.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;

