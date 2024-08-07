import { Schema, model } from "mongoose";

const leaveRequestSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'userType', // Dynamic reference based on the value of userType field
    },
    userType: {
      type: String,
      required: true,
      enum: ['Student', 'Staff'], // Possible values are 'Student' and 'Staff'
    },
    rollNo: {
      type: String,
    },
    regNo: {
      type: String,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
    },
    classInchargeId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
    },
    isHalfDay: {
      type: String,
      enum: ["FN", "AN"],
      default: null,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
    },
    noOfDays: {
      type: Number,
      required: true,
    },
    forMedical: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      required: true,
    },
    typeOfLeave: {
      type: String,
      enum: [
        "Casual Leave", "Sick Leave", "Earned Leave", "Maternity Leave",
        "Paternity Leave", "Study Leave", "Duty Leave", "Special Leave", "Sabbatical Leave"
      ],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvals: {
      mentor: {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        date: Date,
      },
      classIncharge: {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        date: Date,
      },
      hod: {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        date: Date,
      },
    },
    isStaff: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const LeaveRequest = model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;
