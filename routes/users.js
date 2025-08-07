import express from 'express';
import {
    forgotPassword,
    resetPassword,
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    getUserDetails,
    verifyEmail,
    toggleFavoriteHotel,
    getFavoriteHotels // Import the new function
} from '../controllers/userController.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', authenticate, changePassword);
router.get('/profile', authenticate, getUserDetails);
router.get('/verify/:token', verifyEmail);

router.post('/toggle-favorite', authenticate, toggleFavoriteHotel);
router.get('/favorite-hotels', authenticate, getFavoriteHotels);

router.get('/hotels', (req, res) => {
    fs.readFile(HOTELS_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading hotels file:", err);
            return res.status(500).json({ message: "Error reading hotels data", error: err });
        }
        res.status(200).json(JSON.parse(data));
    });
});
 // Add the new route

export default router;