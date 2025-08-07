import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import mongoose from 'mongoose';
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HOTELS_FILE = path.join(__dirname, "../../Fest-Frontend/public/hotels.json");


// Register User
export const registerUser = async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullname, email, password: hashedPassword, isVerified: false, hasLoggedIn: false });
        await newUser.save();

        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const verificationURL = `http://localhost:5173/verify/${verificationToken}`;

        const html = `
            <div style="text-align: center; font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <img src="YOUR_LOGO_URL" alt="Fiesta Finder Logo" style="width: 150px; height: auto;"/>
                <h2 style="color: #333;">Welcome to Fiesta Finder!</h2>
                <p>Please verify your email by clicking on the link below:</p>
                <a href="${verificationURL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>Thank you for joining us!</p>
                <footer style="margin-top: 20px; font-size: 12px;">
                    <p>Follow us on:</p>
                    <a href="https://www.linkedin.com" style="margin-right: 10px;">LinkedIn</a>
                    <a href="https://twitter.com" style="margin-right: 10px;">Twitter</a>
                    <a href="https://www.instagram.com">Instagram</a>
                </footer>
            </div>
        `;

        await sendEmail({ to: email, subject: 'Verify Your Email', text: 'Please verify your email.', html });
        res.status(201).json({ message: 'User registered successfully! Please check your email to verify your account.' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user!', error: error.message });
    }
};





// login User


export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials!' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        if (!user.hasLoggedIn) {
            const html = `
                <div style="text-align: center; font-family: Arial, sans-serif;">
                    <img src="YOUR_LOGO_URL" alt="Fiesta Finder Logo" style="width: 150px; height: auto;"/>
                    <h2>Welcome Back, ${user.fullname}!</h2>
                    <p>We are glad to see you again at Fiesta Finder!</p>
                    <footer style="margin-top: 20px; font-size: 12px;">
                        <p>Follow us on:</p>
                        <a href="https://www.linkedin.com" style="margin-right: 10px;">LinkedIn</a>
                        <a href="https://twitter.com" style="margin-right: 10px;">Twitter</a>
                        <a href="https://www.instagram.com">Instagram</a>
                    </footer>
                </div>
            `;

            // await sendEmail({ to: email, subject: 'Welcome Back to Fiesta Finder!', text: 'Welcome back!', html });
            // user.hasLoggedIn = true;
            // await user.save();
        }

        res.json({ message: 'Login successful!', user: { fullname: user.fullname, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in!', error: error.message });
    }
};




// Logout User
export const logoutUser = (req, res) => {
    // Clear the token cookie to log out the user
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'Logout successful!' });
};



// Get User Details
export const getUserDetails = async (req, res) => {
    try {
        // Retrieve the user ID from the authenticated request
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user details!', error: error.message });
    }
};




// Change Password
export const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        // Retrieve the user ID from the authenticated request
        const userId = req.user.id;
        const user = await User.findById(userId);

        // Compare the old password with the current password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid current password!' });
        }

        // Hash the new password and save it
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password updated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password!', error: error.message });
    }
};



// Forgot Password

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetURL = `http://localhost:5173/reset-password/${resetToken}`;
        const html = `
            <div style="text-align: center; font-family: Arial, sans-serif;">
                <img src="YOUR_LOGO_URL" alt="Fiesta Finder Logo" style="width: 150px; height: auto;"/>
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetURL}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <footer style="margin-top: 20px; font-size: 12px;">
                    <p>Follow us on:</p>
                    <a href="https://www.linkedin.com" style="margin-right: 10px;">LinkedIn</a>
                    <a href="https://twitter.com" style="margin-right: 10px;">Twitter</a>
                    <a href="https://www.instagram.com">Instagram</a>
                </footer>
            </div>
        `;

        await sendEmail({ to: user.email, subject: 'Password Reset Request', text: 'Reset your password.', html });
        res.status(200).json({ message: 'Password reset email sent!' });
    } catch (error) {
        console.error('Error handling password reset:', error);
        res.status(500).json({ message: 'Error handling password reset', error: error.message });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }, // Ensure token is not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token!' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined; // Clear reset token after use
        user.resetTokenExpiration = undefined;
        await user.save();

        res.json({ message: 'Password reset successful!' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Error resetting password!', error: error.message });
    }
};



// Verify Email
export const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email } = decoded;

        // Find the user by email and set isVerified to true
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        user.isVerified = true;
        await user.save();

        // HTML template for the welcome email
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f4; padding: 20px;">
                <h1 style="color: #333;">Welcome to <span style="color: #ff6347;">Fiesta Finder!</span></h1>
                <p style="font-size: 16px; color: #555;">Dear ${user.fullname},</p>
                <p style="font-size: 16px; color: #555;">
                    Thank you for verifying your email! We're thrilled to have you on board.
                </p>
                <p style="font-size: 16px; color: #555;">
                    Best Regards,<br>
                    <strong>Fiesta Finder Team</strong>
                </p>
                <footer style="margin-top: 20px; font-size: 12px;">
                    <p>Follow us on:</p>
                    <a href="https://www.linkedin.com" style="margin-right: 10px;">LinkedIn</a>
                    <a href="https://twitter.com" style="margin-right: 10px;">Twitter</a>
                    <a href="https://www.instagram.com">Instagram</a>
                </footer>
            </div>


        `;

        // Send welcome email after verification
        await sendEmail({
            to: email,
            subject: 'Welcome to Fiesta Finder!',
            html: htmlContent,
        });

        res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying email!', error: error.message });
    }
};

export const toggleFavoriteHotel = async (req, res) => {
    try {
        const { hotelId } = req.body;
        const userId = req.user.id;

        // Validate ID before proceeding
        if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({ message: "Invalid hotel ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
        const isFavorite = user.favorites.some(id => id.equals(hotelObjectId));

        if (isFavorite) {
            user.favorites = user.favorites.filter(id => !id.equals(hotelObjectId));
        } else {
            user.favorites.push(hotelObjectId);
        }

        await user.save();
        res.status(200).json(user.favorites);
    } catch (err) {
        console.error("Error toggling favorite:", err);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

export const getFavoriteHotels = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Read hotels data from the JSON file
        fs.readFile(HOTELS_FILE, "utf8", (err, data) => {
            if (err) {
                return res.status(500).json({ message: "Error reading hotels data", error: err });
            }

            const hotels = JSON.parse(data);
            // Convert user.favorites (ObjectId) to strings for comparison
            const favoriteHotelIds = user.favorites.map(id => id.toString());
            // Filter hotels that are in the user's favorites
            const favoriteHotels = hotels.filter(hotel => favoriteHotelIds.includes(hotel._id));

            console.log("Favorite Hotels:", favoriteHotels); // Debugging
            res.status(200).json(favoriteHotels);
        });
    } catch (error) {
        console.error("Error fetching favorite hotels:", error); // Debugging
        res.status(500).json({ message: "Error fetching favorite hotels", error });
    }
};