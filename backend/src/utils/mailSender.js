const axios = require('axios');

const sendOtpEmail = async (email, otp) => {
    try {
        const payload = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
                to_email: email,
                otp: otp
            }
        };

        const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`EmailJS sent successfully to ${email}`);
        return response.data;
    } catch (error) {
        console.error('Error sending EmailJS:', error.response?.data || error.message);
        throw new Error(error.response?.data || 'Failed to send OTP via EmailJS.');
    }
};

module.exports = { sendOtpEmail };
