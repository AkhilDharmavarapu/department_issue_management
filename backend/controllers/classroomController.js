const Classroom = require('../models/Classroom');
const User = require('../models/User');

/**
 * Create a new classroom
 * Admin only
 */
exports.createClassroom = async (req, res, next) => {
  try {
    const { department, year, section, cr, lr, facultyList } = req.body;

    // Validate required fields
    if (!department || !year || !section) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department, year, and section',
      });
    }

    // Check if CR exists and is a valid user
    if (cr) {
      const crUser = await User.findById(cr);
      if (!crUser) {
        return res.status(404).json({
          success: false,
          message: 'CR user not found',
        });
      }
    }

    // Check if LR exists and is a valid user
    if (lr) {
      const lrUser = await User.findById(lr);
      if (!lrUser) {
        return res.status(404).json({
          success: false,
          message: 'LR user not found',
        });
      }
    }

    const classroom = await Classroom.create({
      department,
      year,
      section,
      cr: cr || null,
      lr: lr || null,
      facultyList: facultyList || [],
    });

    await classroom.populate(['cr', 'lr', 'facultyList']);

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all classrooms
 * Admin only
 */
exports.getAllClassrooms = async (req, res, next) => {
  try {
    const { department, year, section } = req.query;

    let filter = {};
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (section) filter.section = section;

    const classrooms = await Classroom.find(filter)
      .populate(['cr', 'lr', 'facultyList'])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: classrooms.length,
      data: classrooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single classroom by ID
 */
exports.getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id).populate([
      'cr',
      'lr',
      'facultyList',
    ]);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    res.status(200).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update classroom details
 * Admin only
 */
exports.updateClassroom = async (req, res, next) => {
  try {
    const { department, year, section, cr, lr, facultyList } = req.body;

    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Update fields if provided
    if (department) classroom.department = department;
    if (year) classroom.year = year;
    if (section) classroom.section = section;
    if (cr !== undefined) classroom.cr = cr || null;
    if (lr !== undefined) classroom.lr = lr || null;
    if (facultyList) classroom.facultyList = facultyList;

    classroom.updatedAt = Date.now();
    await classroom.save();
    await classroom.populate(['cr', 'lr', 'facultyList']);

    res.status(200).json({
      success: true,
      message: 'Classroom updated successfully',
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get classrooms assigned to the logged-in faculty
 * Faculty only
 */
exports.getMyClassrooms = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const classrooms = await Classroom.find({ facultyList: userId })
      .populate(['cr', 'lr', 'facultyList'])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: classrooms.length,
      data: classrooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a classroom
 * Admin only
 */
exports.deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Classroom deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
