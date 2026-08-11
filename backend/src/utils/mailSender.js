const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Assuming gmail based on the email provided
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Contest Platform" <${process.env.EMAIL_USER}>`,
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
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send OTP email.');
    }
};

module.exports = { sendOtpEmail };
