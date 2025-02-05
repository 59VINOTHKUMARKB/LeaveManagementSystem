import LeaveRequest from "../models/leave.model.js";
import { errorHandler } from "../utils/error.js";
import { notifyLeaveRequestStatus } from "./email.service.js";

export const createLeaveRequest = async (req, res) => {
  try {
    const {
      name,
      parent_phone,
      email,
      userId,
      userType,
      rollNo,
      regNo,
      forMedical,
      batchId,
      sectionId,
      section_name,
      departmentId,
      reason,
      classInchargeId,
      mentorId,
      leaveStartDate,
      leaveEndDate,
      noOfDays,
      isHalfDay,
      typeOfLeave,
    } = req.body;

    const existingLeave = await LeaveRequest.findOne({
      userId,
      $or: [
        {
          leaveStartDate: { $lte: leaveEndDate },
          leaveEndDate: { $gte: leaveStartDate },
        },
        {
          leaveStartDate: { $gte: leaveStartDate },
          leaveEndDate: { $lte: leaveEndDate },
        },
      ],
    });

    if (existingLeave) {
      return res.status(400).json({
        success: false,
        message: "You already have a leave request for this period",
      });
    }

    const studentLeaveRequest = new LeaveRequest({
      name,
      parent_phone,
      email,
      userId,
      userType,
      rollNo,
      regNo,
      forMedical,
      batchId,
      sectionId,
      section_name,
      departmentId,
      reason,
      classInchargeId,
      mentorId,
      fromDate: leaveStartDate,
      toDate: leaveEndDate,
      noOfDays,
      isHalfDay,
      isStaff: false,
    });
    await studentLeaveRequest.save();
    res.status(201).json({
      success: true,
      message: "Student leave request submitted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while submitting the leave request",
    });
  }
};

export const deleteleavebyId = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLeave = await LeaveRequest.findByIdAndDelete(id);
    if (!deletedLeave) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.status(200).json({ message: "Leave request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getleaverequestbyUserId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await LeaveRequest.find({ userId: id }).sort({
      createdAt: -1,
    });
    res.status(200).json(data);
  } catch (error) {
    const customError = errorHandler(500, "Internal Server Error");
    next(customError);
  }
};

export const getleaverequestbyMentorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await LeaveRequest.find({ mentorId: id }).sort({
      createdAt: -1,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    const customError = errorHandler(500, "Internal Server Error");
    next(customError);
  }
};

export const getleaverequestbyclassinchargeid = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Only fetch requests where mentor has taken action (approved or rejected)
    const data = await LeaveRequest.find({
      classInchargeId: id,
      'approvals.mentor.status': { $ne: 'pending' }  // Show when mentor has taken action
    }).sort({
      createdAt: -1,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    const customError = errorHandler(500, "Internal Server Error");
    next(customError);
  }
};

export const updateLeaveRequestStatusByMentorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, mentorcomment } = req.body;
    const validStatuses = ["approved", "rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Status must be 'approved' or 'rejected'.",
      });
    }

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      {
        "approvals.mentor.status": status,
        $set: {
          mentorcomment:
            mentorcomment !== "" ? mentorcomment : "No Comments Yet",
        },
      },
      { new: true }
    );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }
    const who = "Mentor";
    await leaveRequest.computeStatus();
    await leaveRequest.save();

    await notifyLeaveRequestStatus(
      leaveRequest.email,
      leaveRequest.name,
      status,
      leaveRequest.fromDate,
      leaveRequest.toDate,
      mentorcomment,
      who
    );

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      leaveRequest,
    });
  } catch (error) {
    console.error("Error updating leave request status:", error);
    const customError = errorHandler(500, "Internal Server Error");
    next(customError);
  }
};

export const updateLeaveRequestStatusByClassInchargeId = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { status, classInchargeComment } = req.body;
    const validStatuses = ["approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Status must be 'approved' or 'rejected'.",
      });
    }

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      {
        "approvals.classIncharge.status": status,
        $set: {
          classInchargeComment:
            classInchargeComment !== ""
              ? classInchargeComment
              : "No Comments Yet",
        },
      },
      { new: true }
    );

    if (leaveRequest.mentorId === null) {
      leaveRequest.approvals.mentor.status = status;
    }

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    const who = "Class Incharge";
    await leaveRequest.computeStatus();
    await leaveRequest.save();
    await notifyLeaveRequestStatus(
      leaveRequest.email,
      leaveRequest.name,
      status,
      leaveRequest.fromDate,
      leaveRequest.toDate,
      classInchargeComment,
      who
    );

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      leaveRequest,
    });
  } catch (error) {
    console.error("Error updating leave request status:", error);
    const customError = errorHandler(500, "Internal Server Error");
    next(customError);
  }
};

export const updateLeaveRequestStatusByHODId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, hodComment } = req.body;
    const validStatuses = ["approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Status must be 'approved' or 'rejected'.",
      });
    }
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      {
        "approvals.hod.status": status,
        $set: {
          hodComment: hodComment
            ? hodComment
            : ""
            ? classInchargeComment
            : "No Comments Yet",
        },
      },
      { new: true }
    );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    const who = "HOD";
    await leaveRequest.computeStatus();
    await leaveRequest.save();
    await notifyLeaveRequestStatus(
      leaveRequest.email,
      leaveRequest.name,
      status,
      leaveRequest.fromDate,
      leaveRequest.toDate,
      hodComment,
      who
    );

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      leaveRequest,
    });
  } catch (error) {
    console.error("Error updating leave request status:", error);
    const customError = errorHandler(500, "Internal Server Error");
    next(customError);
  }
};

export const getleaverequestsbySectionId = async (req, res, next) => {

  try {
    const { id } = req.params;
    const data = await LeaveRequest.find({ sectionId: id }).sort({
      createdAt: -1,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    const customError = errorHandler(500, "Internal Server Error");
    next(customError);
  }
};

export const mentors = async (req, res) => {
  const { ids } = req.query; 
  const sectionIDs = ids.split(","); 
  try {
    const response = await Staff.find({
      staff_handle_section: { $in: sectionIDs },
    });
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in Fetching the Data ", error.message);
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
};

export const updateLeaveRequestStatusByMentorIdForBothRoles = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status, mentorcomment, isStaffBothRoles } = req.body;

    const validStatuses = ["approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Status must be 'approved' or 'rejected'.",
      });
    }

    const updateData = {
      "approvals.mentor.status": status,
      "mentorcomment": mentorcomment || "No Comments",
    };

    // If staff has both roles, update both statuses
    if (isStaffBothRoles) {
      updateData["approvals.classIncharge.status"] = status;
      updateData["classInchargeComment"] = mentorcomment || "No Comments";
    }

    const updatedRequest = await LeaveRequest.findByIdAndUpdate(
      requestId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    // Compute overall status
    await updatedRequest.computeStatus();
    await updatedRequest.save();

    // Send email notification
    const who = isStaffBothRoles ? "Mentor & Class Incharge" : "Mentor";
    await notifyLeaveRequestStatus(
      updatedRequest.email,
      updatedRequest.name,
      status,
      updatedRequest.fromDate,
      updatedRequest.toDate,
      mentorcomment,
      who
    );

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      leaveRequest: updatedRequest,
    });

  } catch (error) {
    console.error("Error updating leave request status:", error);
    const customError = errorHandler(500, "Internal Server Error");
    next(customError);
  }
};
