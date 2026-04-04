const Issue = require('../models/Issue');
const Classroom = require('../models/Classroom');
const Project = require('../models/Project');
const User = require('../models/User');
const Utility = require('../models/Utility');
const Lab = require('../models/Lab');

/**
 * Admin stats — high-level counts for dashboard
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    const [
      totalClassrooms,
      totalUsers,
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      totalUtilities,
      totalLabs,
      totalProjects,
    ] = await Promise.all([
      Classroom.countDocuments(),
      User.countDocuments(),
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'Open' }),
      Issue.countDocuments({ status: 'In Progress' }),
      Issue.countDocuments({ status: 'Resolved' }),
      Utility.countDocuments(),
      Lab.countDocuments(),
      Project.countDocuments(),
    ]);

    // Issues by classroom
    const issuesByClassroom = await Issue.aggregate([
      { $group: { _id: '$classroomId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'classrooms',
          localField: '_id',
          foreignField: '_id',
          as: 'classroom',
        },
      },
      { $unwind: { path: '$classroom', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          count: 1,
          department: '$classroom.department',
          year: '$classroom.year',
          section: '$classroom.section',
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Issues by priority
    const issuesByPriority = await Issue.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent issues
    const recentIssues = await Issue.find()
      .populate('reportedBy', 'name')
      .populate('classroomId', 'department year section')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status priority createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalClassrooms,
        totalUsers,
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
        totalUtilities,
        totalLabs,
        totalProjects,
        issuesByClassroom,
        issuesByPriority,
        recentIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Faculty stats
 */
exports.getFacultyStats = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Get classrooms where faculty is assigned
    const classrooms = await Classroom.find({ facultyList: userId });
    const classroomIds = classrooms.map(c => c._id);

    const [totalProjects, totalIssues, openIssues, resolvedIssues] = await Promise.all([
      Project.countDocuments({ createdBy: userId }),
      Issue.countDocuments({ classroomId: { $in: classroomIds } }),
      Issue.countDocuments({ classroomId: { $in: classroomIds }, status: 'Open' }),
      Issue.countDocuments({ classroomId: { $in: classroomIds }, status: 'Resolved' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalClassrooms: classrooms.length,
        totalIssues,
        openIssues,
        resolvedIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student stats
 */
exports.getStudentStats = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const [totalIssues, openIssues, inProgressIssues, resolvedIssues] = await Promise.all([
      Issue.countDocuments({ reportedBy: userId }),
      Issue.countDocuments({ reportedBy: userId, status: 'Open' }),
      Issue.countDocuments({ reportedBy: userId, status: 'In Progress' }),
      Issue.countDocuments({ reportedBy: userId, status: 'Resolved' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};
