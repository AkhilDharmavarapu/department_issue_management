const Project = require('../models/Project');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

/**
 * Create a new project assignment
 * Faculty can create projects for their classes
 */
exports.createProject = async (req, res, next) => {
  try {
    const { projectTitle, subject, description, classroomId, teamMembers, deadline, maxTeamSize } = req.body;
    const { userId } = req.user;

    if (!projectTitle || !subject || !classroomId || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectTitle, subject, classroomId, and deadline',
      });
    }

    // Validate classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if faculty is assigned to this classroom
    if (!classroom.facultyList.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this classroom',
      });
    }

    const project = await Project.create({
      projectTitle,
      subject,
      description: description || '',
      facultyId: userId,
      classroomId,
      teamMembers: teamMembers || [],
      deadline,
      maxTeamSize: maxTeamSize || 5,
    });

    await project.populate('classroomId facultyId');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get projects for a specific classroom
 * Faculty can get projects for their classrooms
 * Students can get projects for their classroom
 */
exports.getProjectsByClassroom = async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const { userId, role } = req.user;

    // Validate classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check permissions
    if (role === 'faculty') {
      if (!classroom.facultyList.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this classroom',
        });
      }
    } else if (role === 'student') {
      const user = await User.findById(userId);
      if (user.classroomId.toString() !== classroomId) {
        return res.status(403).json({
          success: false,
          message: 'You are not in this classroom',
        });
      }
    }

    const projects = await Project.find({ classroomId }).populate('facultyId classroomId').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects assigned by logged-in faculty
 */
exports.getMyProjects = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const projects = await Project.find({ facultyId: userId })
      .populate('classroomId facultyId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project by ID
 */
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('facultyId classroomId');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project details
 * Faculty can update their own projects
 */
exports.updateProject = async (req, res, next) => {
  try {
    const { projectTitle, subject, description, deadline, maxTeamSize, status } = req.body;
    const { userId } = req.user;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the project creator
    if (project.facultyId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own projects',
      });
    }

    if (projectTitle) project.projectTitle = projectTitle;
    if (subject) project.subject = subject;
    if (description !== undefined) project.description = description;
    if (deadline) project.deadline = deadline;
    if (maxTeamSize) project.maxTeamSize = maxTeamSize;
    if (status) project.status = status;

    project.updatedAt = Date.now();
    await project.save();
    await project.populate('facultyId classroomId');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add team member to project
 * Faculty can add members using roll numbers
 */
exports.addTeamMember = async (req, res, next) => {
  try {
    const { rollNumber } = req.body;
    const { userId } = req.user;

    if (!rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roll number',
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the project creator
    if (project.facultyId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify your own projects',
      });
    }

    // Check team size limit
    if (project.teamMembers.length >= project.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Team size limit (${project.maxTeamSize}) reached`,
      });
    }

    // Check if member already exists
    if (project.teamMembers.some((m) => m.rollNumber === rollNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Team member already added',
      });
    }

    // Find user by roll number
    const user = await User.findOne({ rollNumber });

    project.teamMembers.push({
      rollNumber,
      userId: user ? user._id : null,
    });

    await project.save();
    await project.populate('facultyId classroomId');

    res.status(200).json({
      success: true,
      message: 'Team member added successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete project
 * Faculty can delete their own projects
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the project creator
    if (project.facultyId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own projects',
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
