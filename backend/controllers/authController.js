const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

/**
 * Login — public route
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      classroomId: user.classroomId,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register — admin creates a new user
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, rollNumber, classroomId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password, // pre-save hook will hash it
      role,
      rollNumber: rollNumber || null,
      classroomId: classroomId || null,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        classroomId: user.classroomId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users — admin only
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    let filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('classroomId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user — admin can toggle active, change role, assign classroom
 */
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, role, classroomId, isActive, rollNumber } = req.body;
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (classroomId !== undefined) user.classroomId = classroomId || null;
    if (isActive !== undefined) user.isActive = isActive;
    if (rollNumber !== undefined) user.rollNumber = rollNumber;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classroomId: user.classroomId,
        isActive: user.isActive,
        rollNumber: user.rollNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-passwordHash')
      .populate('classroomId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

