const Issue = require('../models/Issue');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

/**
 * Create a new issue
 * Students can report issues related to their classroom
 * Can optionally upload a proof image
 */
exports.createIssue = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;
    const { userId } = req.user;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category',
      });
    }

    // Get user's classroom
    const classroomId = req.user.classroomId;

    if (!classroomId) {
      return res.status(400).json({
        success: false,
        message: 'User must be assigned to a classroom',
      });
    }

    // Store file path if proof was uploaded
    const reportProof = req.file ? req.file.filename : null;

    const issue = await Issue.create({
      title,
      description,
      classroomId: classroomId,
      reportedBy: userId,
      category,
      priority: priority || 'Medium',
      status: 'Open',
      reportProof,
    });

    await issue.populate(['classroomId', 'reportedBy', 'assignedTo']);

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all issues for the logged-in user's classroom
 * Students can only see issues from their classroom
 * Faculty can see issues from their classrooms
 * Admin and HOD can see all issues
 */
exports.getMyIssues = async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    const { status, priority } = req.query;

    let filter = {};

    if (role === 'student') {
      // Students can only see issues from their classroom
      const user = await User.findById(userId);
      if (!user.classroomId) {
        return res.status(400).json({
          success: false,
          message: 'User not assigned to any classroom',
        });
      }
      filter.classroomId = user.classroomId;
      filter.reportedBy = userId; // Students see only their own issues
    } else if (role === 'faculty') {
      // Faculty can see issues from their classrooms
      const classrooms = await Classroom.find({ facultyList: userId });
      const classroomIds = classrooms.map((c) => c._id);
      if (classroomIds.length > 0) {
        filter.classroomId = { $in: classroomIds };
      }
    }
    // Admin and HOD see all issues (no filter)

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const issues = await Issue.find(filter)
      .populate(['classroomId', 'reportedBy', 'assignedTo'])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all issues (Admin only)
 */
exports.getAllIssues = async (req, res, next) => {
  try {
    const { status, priority, classroomId } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (classroomId) filter.classroomId = classroomId;

    const issues = await Issue.find(filter)
      .populate(['classroomId', 'reportedBy', 'assignedTo'])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get issue by ID
 */
exports.getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id).populate([
      'classroomId',
      'reportedBy',
      'assignedTo',
      'comments.user',
    ]);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update issue status / priority / assignment
 * Admin can update any issue. HOD can update any issue. Faculty can update issues from their classrooms.
 * Status lifecycle: Open → In Progress → Resolved (forward only)
 */
exports.updateIssueStatus = async (req, res, next) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const { userId, role } = req.user;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    // FACULTY: Check if assigned to the classroom containing this issue
    if (role === 'faculty') {
      const classroom = await Classroom.findById(issue.classroomId);
      if (!classroom || !classroom.facultyList.some((id) => id.toString() === userId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this classroom',
        });
      }
    }
    // ADMIN and HOD: Full access (no additional checks needed)

    // Status lifecycle enforcement
    if (status) {
      const validTransitions = {
        'Open': ['In Progress', 'Resolved'],
        'In Progress': ['Resolved'],
        'Resolved': [], // can't change once resolved
      };

      const allowed = validTransitions[issue.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from "${issue.status}" to "${status}"`,
        });
      }

      issue.status = status;
      if (status === 'Resolved') {
        issue.resolvedAt = new Date();
      }
    }

    if (priority) issue.priority = priority;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo || null;

    await issue.save();
    await issue.populate(['classroomId', 'reportedBy', 'assignedTo', 'comments.user']);

    res.status(200).json({
      success: true,
      message: 'Issue updated successfully',
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload resolution proof for an issue
 * Admin, Faculty, HOD can upload when resolving an issue
 */
exports.uploadResolutionProof = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a proof image',
      });
    }

    // Store file path
    issue.resolutionProof = req.file.filename;
    await issue.save();
    await issue.populate(['classroomId', 'reportedBy', 'assignedTo', 'comments.user']);

    res.status(200).json({
      success: true,
      message: 'Resolution proof uploaded successfully',
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add comment to issue
 */
exports.addComment = async (req, res, next) => {
  try {
    const text = req.body.text || req.body.comment;
    const { userId } = req.user;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide comment text',
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    issue.comments.push({
      user: userId,
      text,
      createdAt: Date.now(),
    });

    await issue.save();
    await issue.populate(['classroomId', 'reportedBy', 'assignedTo', 'comments.user']);

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};
