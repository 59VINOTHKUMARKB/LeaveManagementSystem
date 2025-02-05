import Student from "../models/student.model.js"; // Assuming you have a Student model
import Defaulter from "../models/defaulter.model.js"; //
import Staff from "../models/staff.model.js"; //

export const getStudentDetailsByRollNo = async (req, res) => {
  try {
    const { roll_no } = req.params;
    const studentdata = await Student.findOne({ roll_no })
      .populate("departmentId", "dept_name")
      .populate("batchId", "batch_name")
      .populate("mentorId", "staff_name staff_id")
      .populate("sectionId", "section_name");

    if (!studentdata) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find class incharge using the correct query
    const classIncharge = await Staff.findOne({
      staff_handle_dept: studentdata.departmentId,
      staff_handle_batch: studentdata.batchId,
      staff_handle_section: studentdata.sectionId,
      isClassIncharge: true,
    }).select("staff_name _id");

    // Convert mongoose document to plain object and add additional fields
    const finalData = studentdata.toObject();
    finalData.classInchargeId = classIncharge ? classIncharge._id : "N/A";
    finalData.classInchargeName = classIncharge
      ? classIncharge.staff_name
      : "N/A";
    finalData.sectionName = studentdata.sectionId
      ? studentdata.sectionId.section_name
      : "N/A";
    finalData.departmentName = studentdata.departmentId
      ? studentdata.departmentId.dept_name
      : "N/A";
    finalData.batchName = studentdata.batchId
      ? studentdata.batchId.batch_name
      : "N/A";
    finalData.mentorName = studentdata.mentorId
      ? studentdata.mentorId.staff_name
      : "N/A";
    finalData.mentorId = studentdata.mentorId ? studentdata.mentorId._id : null;

    function getSemesterFromMonth() {
      const currentMonth = new Date().getMonth(); // getMonth() returns 0-11 (Jan=0, Dec=11)

      // Determine semester
      if (currentMonth >= 6 && currentMonth <= 11) {
        return "Odd"; // July (6) - December (11)
      } else {
        return "Even"; // January (0) - June (5)
      }
    }

    //.log(getSemesterFromMonth());

    function getYearByBatch(batch) {
      const currentYear = new Date().getFullYear();

      // Split the batch into start and end years
      const [startYear, endYear] = batch.split("-").map(Number);

      // Calculate the current year in the batch
      if (currentYear < startYear) {
        return "Not yet started"; // Before the batch starts
      } else if (currentYear > endYear) {
        return "Batch completed"; // After the batch ends
      } else {
        return currentYear - startYear + 1; // Calculate current year in batch
      }
    }

    return res.status(200).json({
      studentId: studentdata._id,
      name: studentdata.name,
      parent_phone: studentdata.parent_phone,
      sectionName: studentdata.section_name,
      batch_name: studentdata.batchId ? studentdata.batchId.batch_name : "N/A",
      department_name: studentdata.departmentId
        ? studentdata.departmentId.dept_name
        : "N/A",
      year: getYearByBatch(
        studentdata.batchId ? studentdata.batchId.batch_name : "N/A"
      ),
      semester: getSemesterFromMonth(),
      mentorName: studentdata.mentorId
        ? studentdata.mentorId.staff_name
        : "N/A",
      mentorId: studentdata.mentorId ? studentdata.mentorId._id : null,
      classInchargeName: classIncharge ? classIncharge.staff_name : "N/A",
      classInchargeId: classIncharge ? classIncharge._id : null,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const markDefaulter = async (req, res) => {
  const {
    studentId,
    name,
    parent_phone,
    departmentName,
    batchName,
    sectionName,
    rollNumber,
    entryDate,
    timeIn,
    observation,
    mentorId,
    classInchargeId,
    defaulterType,
  } = req.body;

  try {
    // Check if an entry already exists for the given roll number and date
    const existingEntry = await Defaulter.findOne({
      roll_no: rollNumber,
      entryDate,
    });

    if (existingEntry) {
      return res
        .status(400)
        .json({ message: "Entry already exists for this date" });
    }

    // Create a new defaulter entry with IDs
    const newDefaulter = new Defaulter({
      roll_no: rollNumber,
      studentId,
      name,
      parent_phone,
      departmentName,
      batchName,
      sectionName,
      entryDate,
      timeIn,
      observation,
      mentorId,
      classInchargeId,
      defaulterType,
    });
    const savedDefaulter = await newDefaulter.save();

    return res.status(200).json({
      message: "Defaulter marked successfully",
      defaulter: savedDefaulter,
    });
  } catch (error) {
    console.error("Error marking defaulter:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getDefaulterReport = async (req, res) => {
  const { fromDate, toDate, defaulterType } = req.params;

  try {
    // Convert fromDate and toDate to Date objects
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Check if dates are valid
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Build the query object for Defaulter
    let query = {
      entryDate: {
        $gte: from, // Greater than or equal to fromDate
        $lte: to, // Less than or equal to toDate
      },
    };

    // Add defaulterType to the query if specified
    if (defaulterType) {
      query.defaulterType = defaulterType;
    }

    if (defaulterType === "All") {
      query.defaulterType = {
        $in: ["Late", "Discipline and Dresscode", "Both"],
      };
    }

    // Fetch defaulters based on the query
    const defaulters = await Defaulter.find(query)
      .populate("mentorId", "name") // Populate the mentor's name using mentorId
      .select("roll_no entryDate observation mentorId defaulterType");

    if (defaulters.length === 0) {
      return res
        .status(404)
        .json({ message: "No defaulters found for the given criteria" });
    }

    // For each defaulter, find the student details using roll_no
    const defaulterReport = [];
    for (const defaulter of defaulters) {
      const student = await Student.findOne({
        roll_no: defaulter.roll_no,
      }).select("roll_no name section_name batchId departmentId mentorId"); // Select relevant fields for student

      // Populate department and batch details for the student
      await student.populate("batchId", "batch_name");
      await student.populate("departmentId", "dept_name");
      await student.populate("mentorId", "staff_name");

      function getYearByBatch(batch) {
        const currentYear = new Date().getFullYear();

        // Split the batch into start and end years
        const [startYear, endYear] = batch.split("-").map(Number);

        // Check if the current year is outside the batch range
        if (currentYear < startYear) {
          return "Not yet started"; // Before the batch starts
        } else if (currentYear > endYear) {
          return "Batch completed"; // After the batch ends
        } else {
          // Calculate the year in the batch
          const yearInBatch = endYear - currentYear;
          return Math.min(4, 4 - yearInBatch); // Ensure it doesn't exceed 4
        }
      }

      // Create a report entry
      defaulterReport.push({
        roll_no: defaulter.roll_no,
        studentName: student ? student.name : "N/A",
        batchName: student.batchId ? student.batchId.batch_name : "N/A",
        departmentName: student.departmentId
          ? student.departmentId.dept_name
          : "N/A",
        section_name: student ? student.section_name : "N/A",
        entryDate: defaulter.entryDate,
        observation: defaulter.observation,
        mentorName: student.mentorId ? student.mentorId.staff_name : "N/A",
        defaulterType: defaulter.defaulterType,
        year: getYearByBatch(student.batchId.batch_name),
      });
    }
    // Return the defaulter report
    return res.status(200).json({
      message: "Defaulter report retrieved successfully",
      defaulterReport,
    });
  } catch (error) {
    console.error("Error fetching defaulter report:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getDefaulters = async (req, res) => {
  try {
    const defaulters = await Defaulter.find()
      .populate("mentorId", "staff_name")
      .populate("departmentId", "dept_name")
      .sort({ entryDate: -1 }) // Most recent first
      .limit(50); // Limit to last 50 entries

    return res.status(200).json({
      defaulters: defaulters.map((d) => ({
        _id: d._id,
        studentId: d.studentId,
        roll_no: d.roll_no,
        name: d.name,
        parent_phone: d.parent_phone,
        departmentName: d.departmentName,
        batchName: d.batchName,
        sectionName: d.sectionName,
        defaulterType: d.defaulterType,
        entryDate: d.entryDate,
        mentorName: d.mentorId?.staff_name || "N/A",
        remarks: d.remarks,
        observation: d.observation,
        timeIn: d.timeIn,
        isDone: d.isDone,
      })),
    });
  } catch (error) {
    console.error("Error fetching defaulters:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getDefaulterByStudentId = async (req, res) => {
  const { studentId } = req.params;
  const defaulter = await Defaulter.findOne({ studentId });
  return res.status(200).json({ defaulter });
};

export const assignWork = async (req, res) => {
  try {
    const { id, remarks } = req.body;
    const updatedDefaulter = await Defaulter.findOneAndUpdate(
      { _id: id },
      { remarks },
      { new: true }
    );

    if (!updatedDefaulter) {
      return res.status(404).json({ message: "Defaulter not found" });
    }

    res.status(200).json({
      message: "Work assigned successfully",
      defaulter: updatedDefaulter,
    });
  } catch (error) {
    console.error("Error assigning work:", error);
    res.status(500).json({ message: "Error assigning work" });
  }
};

export const markAsDone = async (req, res) => {
  const { workId } = req.body;
  try {
    const work = Defaulter.findOneAndUpdate(
      { _id: workId },
      { isDone: true },
      { new: true }
    );
    res.status(200).json({
      message: "Work marked as done successfully",
      defaulter: work,
    });
  } catch (error) {
    console.error("Error Saving Assigned:", error);
    res.status(500).json({ message: "Error Saving Assigned" });
  }
};

export const getPendingWorksByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const defaulters = await Defaulter.find({
      studentId: studentId,
      remarks: { $exists: true, $ne: "" }, // Only get entries with remarks
    }).sort({ entryDate: -1 });

    res.status(200).json({
      success: true,
      pendingWorks: defaulters,
    });
  } catch (error) {
    console.error("Error fetching pending works:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending works",
    });
  }
};

export const getDefaultersByMentorId = async (req, res) => {
  const { mentorId } = req.params;
  const defaulters = await Defaulter.find({mentorId:mentorId})
  .populate("mentorId", "staff_name")
  .populate("departmentId", "dept_name")
  .sort({ entryDate: -1 })
  .limit(50);  
  
  return res.status(200).json({ defaulters });
};

export const getDefaultersByClassInchargeId = async (req, res) => {
  const { classInchargeId } = req.params;
  const defaulters = await Defaulter.find({ classInchargeId: classInchargeId })
  .populate("mentorId", "staff_name")
  .populate("departmentId", "dept_name")
  .sort({ entryDate: -1 })
  .limit(50);  

   return res.status(200).json({ defaulters });
};

