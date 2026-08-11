const { Resend } = require('resend');

const sendOtpEmail = async (email, otp) => {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: 'Contest Platform <onboarding@resend.dev>', // You can change this to your verified domain later
            to: email,
            subject: 'Your Registration OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #4A90E2; text-align: center;">Verify Your Email Address</h2>
                    <p style="font-size: 16px; color: #333;">Hello,</p>
                    <p style="font-size: 16px; color: #333;">Thank you for registering on our Contest Platform. Please use the following One-Time Password (OTP) to complete your signup process.</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; background-color: #f4f4f4; border-radius: 5px; letter-spacing: 5px;">
                            ${otp}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #666; text-align: center;">This OTP is valid for <strong>1 minute</strong>. Do not share this code with anyone.</p>
                </div>
            `
        });

        if (error) {
            console.error('Resend API Error:', error);
            throw new Error(error.message);
        }

        console.log(`Email sent successfully to ${email}`);
        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendOtpEmail };
