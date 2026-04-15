const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an issue title'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Classroom ID is required'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Minor', 'Normal', 'Important', 'Urgent'],
      default: 'Normal',
    },
    category: {
      type: String,
      required: true,
      enum: ['infrastructure', 'equipment', 'utilities', 'other'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reportProof: {
      type: String,
      default: null, // File path for student-uploaded proof
    },
    resolutionProof: {
      type: String,
      default: null, // File path for admin/faculty/HOD-uploaded proof
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // auto createdAt + updatedAt, no duplicates
  }
);

module.exports = mongoose.model('Issue', issueSchema);
