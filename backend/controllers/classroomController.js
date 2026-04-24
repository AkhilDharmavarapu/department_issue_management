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

/**
 * TASK 1-2: Get students for a specific classroom
 * Returns ONLY students assigned to that classroom
 * Admin only
 */
exports.getClassroomStudents = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    
    // ==================== TASK 1: LOG req.params.id ====================
    const classroomIdParam = req.params.id;
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ TASK 1: DEBUG CLASSROOM STUDENTS MAPPING                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('[req.params.id] Value:', classroomIdParam);
    console.log('[req.params.id] Type:', typeof classroomIdParam);
    console.log('[req.params.id] Is Valid ObjectId?', mongoose.Types.ObjectId.isValid(classroomIdParam));

    // Verify classroom exists
    const classroom = await Classroom.findById(classroomIdParam);
    if (!classroom) {
      console.log('[ERROR] Classroom not found with ID:', classroomIdParam);
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    console.log('[Classroom._id] Value:', classroom._id.toString());
    console.log('[Classroom._id] Type:', typeof classroom._id);
    console.log('[Classroom._id] ObjectId?', classroom._id instanceof mongoose.Types.ObjectId);

    // ==================== TASK 1: LOG ALL STUDENT classroomId VALUES ====================
    console.log('\n--- FETCHING ALL STUDENTS WITH DETAILED classroomId INFO ---');
    
    const allStudentsRaw = await User.find({ role: 'student' })
      .select('name registrationNumber classroomId');
    
    console.log(`[Total Students in DB]: ${allStudentsRaw.length}`);
    
    if (allStudentsRaw.length > 0) {
      console.log('\n[Sample of student classroomId VALUES & TYPES]:');
      allStudentsRaw.slice(0, 5).forEach((student, idx) => {
        const cid = student.classroomId;
        const type = cid ? typeof cid : 'null/undefined';
        const isObjectId = cid instanceof mongoose.Types.ObjectId;
        const isString = typeof cid === 'string';
        const value = cid ? cid.toString() : 'null/undefined';
        
        console.log(`  [${idx + 1}] Name: ${student.name} | RegNo: ${student.registrationNumber}`);
        console.log(`      classroomId: ${value}`);
        console.log(`      Type: ${type} | ObjectId? ${isObjectId} | String? ${isString}`);
      });
    }

    // ==================== TASK 2: FORCE MATCHING TYPES ====================
    console.log('\n--- TASK 2: ATTEMPTING QUERIES WITH BOTH TYPES ---');

    // Try as ObjectId
    const convertedId = new mongoose.Types.ObjectId(classroomIdParam);
    console.log('[Query 1] Using ObjectId:', convertedId);
    const studentsAsObjectId = await User.find({
      role: 'student',
      classroomId: convertedId,
    }).select('name registrationNumber classroomId');
    console.log(`[Query 1 Result] Found ${studentsAsObjectId.length} students`);

    // Try as String
    console.log('[Query 2] Using String:', classroomIdParam);
    const studentsAsString = await User.find({
      role: 'student',
      classroomId: classroomIdParam,
    }).select('name registrationNumber classroomId');
    console.log(`[Query 2 Result] Found ${studentsAsString.length} students`);

    // Use whichever returned results
    let students = studentsAsObjectId.length > 0 ? studentsAsObjectId : studentsAsString;
    
    if (studentsAsObjectId.length > 0 && studentsAsString.length === 0) {
      console.log('✅ [DIAGNOSIS] classroomId stored as ObjectId - Query 1 worked');
    } else if (studentsAsString.length > 0 && studentsAsObjectId.length === 0) {
      console.log('✅ [DIAGNOSIS] classroomId stored as STRING - Query 2 worked');
    } else if (studentsAsObjectId.length > 0 && studentsAsString.length > 0) {
      console.log('⚠️  [DIAGNOSIS] Both queries returned results - possible data inconsistency');
      students = studentsAsObjectId; // Prefer ObjectId
    } else {
      console.log('❌ [DIAGNOSIS] No students found with either query type');
    }

    // ==================== TASK 1: MANUAL COMPARISON ====================
    console.log('\n--- TASK 1: MANUAL COMPARISON ---');
    console.log(`[Classroom ID (from param)]: ${classroomIdParam}`);
    console.log(`[Classroom ID (from DB)]: ${classroom._id.toString()}`);
    console.log(`[Match?] ${classroomIdParam === classroom._id.toString() ? '✅ YES' : '❌ NO'}`);

    if (students.length > 0) {
      console.log('\n[Sample Matches]:');
      students.slice(0, 3).forEach((student, idx) => {
        const match = student.classroomId.toString() === classroom._id.toString();
        console.log(`  [${idx + 1}] ${student.name}`);
        console.log(`      Student classroomId: ${student.classroomId.toString()}`);
        console.log(`      Classroom._id: ${classroom._id.toString()}`);
        console.log(`      Match? ${match ? '✅' : '❌'}`);
      });
    }

    // ==================== TASK 4: DATA CONSISTENCY CHECK ====================
    console.log('\n--- TASK 4: DATA CONSISTENCY CHECK ---');
    
    // Check data types in database
    const typeCheck = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: { $type: '$classroomId' },
          count: { $sum: 1 },
          samples: { $push: { name: '$name', classroomId: '$classroomId' } },
        },
      },
    ]);

    console.log('[classroomId Field Types in Database]:');
    typeCheck.forEach(record => {
      console.log(`  Type: ${record._id}, Count: ${record.count}`);
      if (record.samples.length > 0) {
        console.log(`    Sample: ${record.samples[0].classroomId} (from ${record.samples[0].name})`);
      }
    });

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ END DEBUG OUTPUT                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Return students sorted by name
    students = students.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      count: students.length,
      debug: {
        classroomIdParam,
        classroomIdFromDb: classroom._id.toString(),
        classroomIdMatch: classroomIdParam === classroom._id.toString(),
        typeMatches: {
          queryObjectId: studentsAsObjectId.length,
          queryString: studentsAsString.length,
        },
      },
      data: students,
    });
  } catch (error) {
    console.error('[CLASSROOM STUDENTS] ERROR:', error.message);
    console.error(error);
    next(error);
  }
};
