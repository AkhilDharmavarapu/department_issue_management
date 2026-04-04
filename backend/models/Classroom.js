const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Please provide a department name'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Please provide the year'],
      enum: [1, 2, 3, 4],
    },
    section: {
      type: String,
      required: [true, 'Please provide a section'],
      trim: true,
    },
    programDuration: {
      type: Number,
      default: 4,
      description: 'Program duration in years',
    },
    cr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      description: 'Class Representative',
    },
    lr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      description: 'Lab Representative',
    },
    facultyList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Classroom', classroomSchema);
