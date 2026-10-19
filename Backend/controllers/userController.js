import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// @desc    Get all users (excluding passwords)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to retrieve user accounts.' });
  }
};

// @desc    Create a new user account (Admin or Mechanic)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const { username, name, phone, role, password } = req.body;

    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();

    if (!cleanUsername || !cleanName || !password) {
      return res.status(400).json({ message: 'Username, full name, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Mechanic';

    // Check for duplicate username
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(409).json({ message: `Username "${cleanUsername}" is already taken.` });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: cleanUsername,
      name: cleanName,
      phone: cleanPhone,
      role: assignedRole,
      password: hashedPassword,
      isActive: true
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({ message: `${assignedRole} account created successfully.`, user: userObj });
  } catch (error) {
    console.error('Error creating user:', error);
    // Handle MongoDB unique index collision error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `An account with that ${field} already exists.` });
    }
    res.status(500).json({ message: error.message || 'Failed to create user account.' });
  }
};

export const getActiveMechanics = async (req, res) => {
  try {
    const mechanics = await User.find({
      role: { $regex: /^mechanic$/i },
      isActive: { $ne: false }
    })
      .select('_id name username phone role')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json(mechanics);
  } catch (error) {
    console.error('Error in getActiveMechanics:', error);
    return res.status(500).json({ message: 'Failed to retrieve mechanics list.' });
  }
};

// @desc    Update user details, role, or reset password
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { name, phone, role, isActive, password } = req.body;
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    // Safety: Prevent downgrading the last Admin
    if (userToUpdate.role === 'Admin' && role === 'Mechanic') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Security Block: Cannot downgrade the only remaining Admin account.' });
      }
    }

    if (name) userToUpdate.name = String(name).trim();
    if (phone !== undefined) userToUpdate.phone = String(phone).trim();
    if (role && ['Admin', 'Mechanic'].includes(role)) userToUpdate.role = role;
    if (typeof isActive === 'boolean') userToUpdate.isActive = isActive;

    // Only hash and update password if a non-empty string with at least 6 characters is supplied
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      userToUpdate.password = await bcrypt.hash(password.trim(), salt);
    }

    await userToUpdate.save();

    const userObj = userToUpdate.toObject();
    delete userObj.password;

    res.status(200).json({ message: 'User updated successfully.', user: userObj });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: error.message || 'Failed to update user account.' });
  }
};

// @desc    Delete a user account
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.params.id;

    // Safety 1: Prevent user from deleting their own active account
    if (req.user && (req.user._id?.toString() === userIdToDelete || req.user.id === userIdToDelete)) {
      return res.status(400).json({ message: 'Security Block: You cannot delete your own logged-in account.' });
    }

    const targetUser = await User.findById(userIdToDelete);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Safety 2: Prevent deleting the last Admin account
    if (targetUser.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Security Block: Cannot delete the only remaining Admin in the system.' });
      }
    }

    await User.findByIdAndDelete(userIdToDelete);
    res.status(200).json({ message: `Account "${targetUser.username}" permanently removed.` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user account.' });
  }
};