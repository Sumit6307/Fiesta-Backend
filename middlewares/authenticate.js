import jwt from 'jsonwebtoken';
import User from '../models/User.js';  // Adjust the import path as needed

const authenticate = async (req, res, next) => {
    const token = req.cookies.token; // Or get the token from headers if not using cookies
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);  // Assuming the token stores the user's ID
        if (!req.user) {
            return res.status(404).json({ error: 'User not found' });
        }
        next();  // Proceed to the next middleware (in this case, the controller function)
    } catch (err) {
        console.error('Error in authentication:', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export default authenticate;