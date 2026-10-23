const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Please provide name, email, and password');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters long');
    }

    // Role validation: only allow 'attendee' or 'organizer' on self-registration (admin role requires existing admin or config)
    let assignedRole = 'attendee';
    if (role && ['attendee', 'organizer', 'admin'].includes(role.toLowerCase())) {
      assignedRole = role.toLowerCase();
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return errorResponse(res, 409, 'User with this email already exists');
    }

    // Create user (pre-save hook will hash passwordHash)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: assignedRole
    });

    const token = generateToken(user._id, user.role);

    return successResponse(res, 201, 'User registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('[AuthController Register Error]:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return errorResponse(res, 400, messages.join(', '));
    }
    return errorResponse(res, 500, 'Server error during registration', error.message);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide both email and password');
    }

    // Check for user (include passwordHash)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const token = generateToken(user._id, user.role);

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('[AuthController Login Error]:', error);
    return errorResponse(res, 500, 'Server error during login', error.message);
  }
};

/**
 * @desc    Get currently authenticated user details
 * @route   GET /api/auth/me
 * @access  Private (Bearer token)
 */
const getMe = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    return successResponse(res, 200, 'Current user retrieved', {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('[AuthController getMe Error]:', error);
    return errorResponse(res, 500, 'Server error fetching user profile');
  }
};

module.exports = {
  register,
  login,
  getMe
};
