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

console.log("LOGIN HIT");
console.log("Email:", email);

const user = await User.findOne({ email }).select('+passwordHash');

console.log("User from DB:", user);

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
    console.log("Password match:", isPasswordMatch);

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
 * Register — admin only
 */
exports.register = async (req, res, next) => {
  try {
    // Ensure only admin can create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create users',
      });
    }

    const { name, email, password, role, rollNumber, classroomId, courseType, specialization } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    // Prevent admin from creating HOD through API
    if (role === 'hod') {
      return res.status(400).json({
        success: false,
        message: 'HOD is a system-level role and cannot be created through this endpoint. Use the separate HOD setup endpoint.',
      });
    }

    // Validate courseType and specialization for MTech students only
    if (role === 'student') {
      if (courseType === 'MTech' && !specialization) {
        return res.status(400).json({
          success: false,
          message: 'Specialization is required for MTech students',
        });
      }
    }

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Set specialization to null if courseType is BTech
    const finalSpecialization = courseType === 'BTech' ? null : (specialization || null);

    const user = await User.create({
      name,
      email,
      passwordHash: password, // pre-save hook will hash it
      role,
      rollNumber: rollNumber || null,
      classroomId: classroomId || null,
      courseType: courseType || 'BTech',
      specialization: finalSpecialization,
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
        courseType: user.courseType,
        specialization: user.specialization,
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
 * Update user — admin only
 * For HOD: Allow editing name and email only. Not allowed to change role or delete.
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Ensure only admin can update users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update users',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // For HOD: Allow only name and email updates
    if (user.role === 'hod') {
      const { name, email } = req.body;
      
      // Check if email is being changed and is already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use by another user',
          });
        }
      }
      
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      
      // Prevent changing HOD role or isActive status through this endpoint
      if (req.body.role || req.body.isActive !== undefined) {
        return res.status(400).json({
          success: false,
          message: 'HOD role and status cannot be changed. Use the "Assign HOD" feature to change HOD.',
        });
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'HOD information updated successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    }

    // Prevent changing a user to HOD role through update endpoint
    if (req.body.role === 'hod') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign HOD role through this endpoint. Use the "Assign HOD" feature.',
      });
    }

    // Normal user update
    const { name, role, classroomId, isActive, rollNumber, courseType, specialization } = req.body;
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (classroomId !== undefined) user.classroomId = classroomId || null;
    if (isActive !== undefined) user.isActive = isActive;
    if (rollNumber !== undefined) user.rollNumber = rollNumber;
    if (courseType !== undefined) user.courseType = courseType;
    if (specialization !== undefined) user.specialization = specialization || null;

    // Clean up specialization if courseType is BTech
    if (user.courseType === 'BTech') {
      user.specialization = null;
    }

    // Validate courseType and specialization for MTech students only
    if (user.role === 'student') {
      if (user.courseType === 'MTech' && !user.specialization) {
        return res.status(400).json({
          success: false,
          message: 'Specialization is required for MTech students',
        });
      }
    }

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
        courseType: user.courseType,
        specialization: user.specialization,
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

/**
 * Assign HOD role to a faculty user — admin only
 * Only one user can have HOD role at a time
 * Removes HOD role from existing HOD if any
 */
exports.assignHOD = async (req, res, next) => {
  try {
    // Ensure only admin can assign HOD
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can assign HOD',
      });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId',
      });
    }

    // Fetch the user to be promoted to HOD
    const newHOD = await User.findById(userId);
    if (!newHOD) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent assigning HOD to non-faculty users (except already HOD)
    if (newHOD.role !== 'faculty' && newHOD.role !== 'hod') {
      return res.status(400).json({
        success: false,
        message: 'Only faculty members can be assigned as HOD',
      });
    }

    // If user is already HOD, no change needed
    if (newHOD.role === 'hod') {
      return res.status(200).json({
        success: true,
        message: 'User is already HOD',
        data: newHOD,
      });
    }

    // Find and remove HOD role from existing HOD user
    const existingHOD = await User.findOne({ role: 'hod' });
    if (existingHOD) {
      existingHOD.role = 'faculty'; // Demote existing HOD back to faculty
      await existingHOD.save();
    }

    // Assign HOD role to new user
    newHOD.role = 'hod';
    await newHOD.save();

    res.status(200).json({
      success: true,
      message: 'HOD assigned successfully',
      data: {
        _id: newHOD._id,
        name: newHOD.name,
        email: newHOD.email,
        role: newHOD.role,
        isActive: newHOD.isActive,
        previousHOD: existingHOD ? {
          _id: existingHOD._id,
          name: existingHOD.name,
          email: existingHOD.email,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user — admin only
 * Prevents deletion of HOD user
 */
exports.deleteUser = async (req, res, next) => {
  try {
    // Ensure only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete users',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting HOD user
    if (user.role === 'hod') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete HOD user. Assign HOD role to another user first.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

