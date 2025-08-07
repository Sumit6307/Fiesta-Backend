import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ CORS configuration for both development and production
const allowedOrigins = [
    'http://localhost:5173',             // local dev
    'https://fiesta-finder.vercel.app'   // production
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (e.g., Postman or curl)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    })
);

// Routes
app.use('/api/users', userRoutes); // Prefix for user-related routes

// Connect to MongoDB and start the server
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`✅ Mongo Atlas Connected and Server running on port ${PORT}`)))
    .catch((error) => console.error('❌ MongoDB connection error:', error));
