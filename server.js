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
app.use(
    cors({
        origin: 'http://localhost:5173', // Allow frontend
        credentials: true, // Allow cookies
    })
);

// Routes
app.use('/api/users', userRoutes); // Prefix for user-related routes

// Connect to MongoDB and start the server
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`Mongo Atlas Connected and Server running on port ${PORT}`)))
    .catch((error) => console.error('MongoDB connection error:', error));
