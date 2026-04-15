const Classroom = require('../models/Classroom');
const Room = require('../models/Room');
const User = require('../models/User');

/**
 * Create a new classroom
 * Admin only
 */
exports.createClassroom = async (req, res, next) => {
  try {
    const { course, specialization, year, section, block, room, department, cr, lr, facultyList } = req.body;

    // Validate required fields
    if (!course || !specialization || year === undefined || !section || !block || !room) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course, specialization, year, section, block, and room',
      });
    }

    // Validate course value
    if (!['BTech', 'MTech'].includes(course)) {
      return res.status(400).json({
        success: false,
        message: 'Course must be either BTech or MTech',
      });
    }

    // Validate year based on course
    const maxYear = course === 'MTech' ? 2 : 4;
    if (year < 1 || year > maxYear) {
      return res.status(400).json({
        success: false,
        message: `Year must be between 1 and ${maxYear} for ${course}`,
      });
    }

    // ==================== CHECK FOR DUPLICATES ====================
    // Ensure combination of course + specialization + year + section is unique
    const existingClassroom = await Classroom.findOne({
      course,
      specialization: specialization.toUpperCase(),
      year: parseInt(year),
      section: section.toUpperCase(),
    });

    if (existingClassroom) {
      return res.status(409).json({
        success: false,
        message: `Classroom already exists: ${course} - ${specialization.toUpperCase()} Year ${year} Section ${section.toUpperCase()}`,
      });
    }

    // ==================== VALIDATE AND ASSIGN ROOM ====================
    // Check if room exists and is available
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if room is already assigned to another classroom
    if (roomDoc.assignedTo) {
      return res.status(409).json({
        success: false,
        message: `Room ${roomDoc.number} is already assigned to another classroom`,
      });
    }

    // Validate block matches room's block
    if (roomDoc.block !== block) {
      return res.status(400).json({
        success: false,
        message: `Selected room belongs to ${roomDoc.block}, but you selected ${block}`,
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

    // Create classroom
    const classroom = await Classroom.create({
      course,
      specialization: specialization.toUpperCase(),
      year,
      section: section.toUpperCase(),
      block,
      room,
      department: department || specialization,
      cr: cr || null,
      lr: lr || null,
      facultyList: facultyList || [],
    });

    // Assign room to this classroom
    roomDoc.assignedTo = classroom._id;
    await roomDoc.save();

    await classroom.populate(['cr', 'lr', 'facultyList', 'room']);

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
    const { course, specialization, year, section, block, department } = req.query;

    let filter = {};
    if (course) filter.course = course;
    if (specialization) filter.specialization = specialization.toUpperCase();
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section.toUpperCase();
    if (block) filter.block = block;
    if (department) filter.department = department;

    const classrooms = await Classroom.find(filter)
      .populate(['cr', 'lr', 'facultyList', 'room'])
      .sort({ course: 1, specialization: 1, year: 1, section: 1 });

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
    const { course, specialization, year, section, block, room, department, cr, lr, facultyList } = req.body;

    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // If course is being updated, validate it
    if (course && !['BTech', 'MTech'].includes(course)) {
      return res.status(400).json({
        success: false,
        message: 'Course must be either BTech or MTech',
      });
    }

    // If year is being updated, validate it based on course
    if (year !== undefined) {
      const courseToCheck = course || classroom.course;
      const maxYear = courseToCheck === 'MTech' ? 2 : 4;
      if (year < 1 || year > maxYear) {
        return res.status(400).json({
          success: false,
          message: `Year must be between 1 and ${maxYear} for ${courseToCheck}`,
        });
      }
    }

    // ==================== HANDLE ROOM CHANGE ====================
    let newRoom = null;
    if (room && !classroom.room?.equals(room)) {
      // User is changing the room
      newRoom = await Room.findById(room);
      if (!newRoom) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }

    // Check if new room is already assigned
      if (newRoom.assignedTo && !newRoom.assignedTo.equals(classroom._id)) {
        return res.status(409).json({
          success: false,
          message: `Room ${newRoom.number} is already assigned to another classroom`,
        });
      }

      // Validate block matches room's block
      if (newRoom.block !== (block || classroom.block)) {
        return res.status(400).json({
          success: false,
          message: `Selected room belongs to ${newRoom.block}, but you selected ${block || classroom.block}`,
        });
      }

      // Clear assignment of old room
      if (classroom.room) {
        const oldRoom = await Room.findById(classroom.room);
        if (oldRoom) {
          oldRoom.assignedTo = null;
          await oldRoom.save();
        }
      }
    }

    // Check if CR exists and is a valid user
    if (cr !== undefined) {
      if (cr && !classroom.cr?.equals(cr)) {
        const crUser = await User.findById(cr);
        if (!crUser) {
          return res.status(404).json({
            success: false,
            message: 'CR user not found',
          });
        }
      }
    }

    // Check if LR exists and is a valid user
    if (lr !== undefined) {
      if (lr && !classroom.lr?.equals(lr)) {
        const lrUser = await User.findById(lr);
        if (!lrUser) {
          return res.status(404).json({
            success: false,
            message: 'LR user not found',
          });
        }
      }
    }

    // Update fields if provided
    if (course) classroom.course = course;
    if (specialization) classroom.specialization = specialization.toUpperCase();
    if (year !== undefined) classroom.year = year;
    if (section) classroom.section = section.toUpperCase();
    if (block) classroom.block = block;
    if (room) classroom.room = room;
    if (department) classroom.department = department;
    if (cr !== undefined) classroom.cr = cr || null;
    if (lr !== undefined) classroom.lr = lr || null;
    if (facultyList) classroom.facultyList = facultyList;

    // Assign new room if changed
    if (newRoom) {
      newRoom.assignedTo = classroom._id;
      await newRoom.save();
    }

    await classroom.save();
    await classroom.populate(['cr', 'lr', 'facultyList', 'room']);

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
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Clear room assignment
    if (classroom.room) {
      const room = await Room.findById(classroom.room);
      if (room) {
        room.assignedTo = null;
        await room.save();
      }
    }

    await Classroom.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Classroom deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available rooms by block
 * Shows unassigned rooms, or assigned room if editing that classroom
 * Admin only
 */
exports.getAvailableRooms = async (req, res, next) => {
  try {
    const { block } = req.params;
    const { excludeClassroomId } = req.query;

    if (!block) {
      return res.status(400).json({
        success: false,
        message: 'Please provide block parameter',
      });
    }

    // Validate block
    if (!['Main Block', 'Algorithm Block'].includes(block)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid block. Must be "Main Block" or "Algorithm Block"',
      });
    }

    // Find rooms: unassigned OR assigned to current classroom
    const rooms = await Room.find({
      block,
      isActive: true,
      $or: [
        { assignedTo: null },
        // If editing a classroom, also show its current room
        ...(excludeClassroomId ? [{ assignedTo: excludeClassroomId }] : []),
      ],
    }).sort({ number: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};
