import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authRouter = express.Router();

// POST /api/auth/register
// Creates a new user (Admin/Mechanic) with a hashed password
authRouter.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // 2. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save the new user to MongoDB
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || 'Mechanic' // Defaults to Mechanic if no role is provided
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
// Verifies credentials and returns a JWT
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the user in the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // 2. Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // 3. Generate the JWT (expires in 1 day)
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // 4. Send the token and user details back to the React frontend
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default authRouter;