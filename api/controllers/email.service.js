import nodemailer from "nodemailer";
import schedule from "node-schedule";
import LeaveRequest from "../models/leave.model.js";
import transporter from "../utils/transporter.js";
import ODRequest from "../models/od.model.js";
import Staff from "../models/staff.model.js";
import Batch from "../models/batch.model.js";
import Defaulter from "../models/defaulter.model.js";

export const changeMailSendTiming = (req, res) => {
  const { time } = req.body;
  if (!time) {
    return res.status(400).json({
      success: false,
      message: "Time is required",
    });
  }

  try {
    const [hours, minutes] = time.split(":");

    console.log("Hours:", hours);
    console.log("Minutes:", minutes);

    res.status(200).json({
      success: true,
      message: "Time changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the time.",
    });
  }
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"VCET Connect" <${process.env.EMAIL}>`,
      to,
      subject,
      html: htmlContent,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendEmailWithAttachments = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"VCET Connect" <${process.env.EMAIL}>`,
      to,
      subject,
      html: htmlContent,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  const month = d.toLocaleString("default", { month: "short" });
  const day = d.getDate();
  return `${day} ${month}`;
};

const generateRequestsSection = (requests, isOd, isDefaulter) => {
  if (!Array.isArray(requests) || requests.length === 0) {
    return `
      <div style="text-align: center; padding: 15px; color: #666; background: #f8f9fa; border-radius: 4px;">
        No requests available at this time
      </div>
    `;
  }

  const getStatusStyle = (status) => {
    const colors = {
      approved: "#4CAF50",
      pending: "#FFA000",
      rejected: "#F44336",
    };
    return colors[status.toLowerCase()] || "#757575";
  };

  const requestsList = requests
    .map(
      (req) => `
    <div style="border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 10px; background: white;">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
        <div style="font-weight: 500;">${
          req.name || req.studentName || "-"
        } <span style="color: #666; font-size: 12px; font-weight: normal;">${
        isDefaulter ? req.roll_no : req.rollNo || "-"
      }</span></div>
        ${
          !isDefaulter
            ? `<span style="font-size: 11px; padding: 3px 8px; border-radius: 12px; background: ${getStatusStyle(
                req.status
              )}15; color: ${getStatusStyle(req.status)};">
            ${req.status || "Pending"}
          </span>`
            : ""
        }
      </div>

      <!-- Content Section -->
      <div style="padding: 8px 12px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 12px;">
          <!-- Date Info -->
          <div>
            <span style="color: #666;">Date:</span>
            <span style="margin-left: 4px;">
              ${
                !isDefaulter
                  ? `${formatDate(req.fromDate)}${
                      req.toDate && req.fromDate !== req.toDate
                        ? ` - ${formatDate(req.toDate)}`
                        : ""
                    } • ${req.noOfDays || "-"}d`
                  : formatDate(req.entryDate)
              }
            </span>
          </div>

          <!-- Type/Reason Info -->
          <div>
            <span style="color: #666;">${
              isOd ? "Type" : isDefaulter ? "Category" : "Reason"
            }:</span>
            <span style="margin-left: 4px;">
              ${
                isOd || isDefaulter
                  ? `<span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; 
                    ${
                      isOd
                        ? "background: #E3F2FD; color: #1565C0;"
                        : "background: #FBE9E7; color: #D84315;"
                    }">
                    ${isOd ? req.odType : req.defaulterType || "-"}
                  </span>`
                  : req.reason || "-"
              }
            </span>
          </div>
        </div>

        ${
          isOd && req.odType === "External"
            ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #666;">
              Event: ${req.eventName || "-"} at ${req.collegeName || "-"}
            </div>`
            : ""
        }

        ${
          isDefaulter && req.defaulterType
            ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #666;">
              ${
                req.defaulterType === "Late"
                  ? `Time In: ${req.timeIn}`
                  : req.defaulterType === "Discipline and Dresscode"
                  ? `Observation: ${req.observation}`
                  : `Time In: ${req.timeIn} • Observation: ${req.observation}`
              }
            </div>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");

  return `
    <div style="margin-bottom: 10px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="flex-grow: 1; height: 1px; background: #e0e0e0;"></div>
        <h3 style="margin: 0 8px; color: #1a237e; font-size: 13px; text-transform: uppercase;">
          ${isOd ? "OD" : isDefaulter ? "Defaulter" : "Leave"} Requests
        </h3>
        <div style="flex-grow: 1; height: 1px; background: #e0e0e0;"></div>
      </div>
      ${requestsList}
    </div>
  `;
};

const generateEmailTemplate = (title, content) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.4; color: #333; background-color: #f5f5f5; margin: 0; padding: 8px;">
        <div style="max-width: 800px; margin: 0 auto; background: #f8f9fa; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: white; padding: 12px; text-align: center; border-bottom: 1px solid #e0e0e0;">
            <h2 style="color: #1a237e; margin: 0; font-size: 16px;">${title}</h2>
          </div>
          
          <!-- Content -->
          <div style="padding: 10px; background: white; margin: 8px; border-radius: 4px;">
            ${content}
          </div>

          <!-- Footer -->
          <div style="background: white; padding: 8px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; font-size: 11px; margin: 2px 0;">
              This is an automated summary from VCET Connect
            </p>
            <p style="color: #666; font-size: 11px; margin: 2px 0;">
              © ${new Date().getFullYear()} VCET Connect - Leave Management System
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateRequestRow = (request, isOd) => {
  console.log("request from generateRequestRow", request);
  const row = `
    <tr>
      <td>${request.studentName}</td>
      <td>${new Date(request.fromDate).toLocaleDateString()}</td>
      <td>${new Date(request.toDate).toLocaleDateString()}</td>
      <td>${request.noOfDays}</td>
      <td>${isOd ? request.Type : request.reason}</td>
      <td>
        ${
          isOd
            ? request.Type === "External"
              ? `${request.eventName} at ${request.collegeName}`
              : request.reason
            : request.reason
        }
      </td>
      <td>${request.status}</td>
    </tr>
  `;
  return row;
};

const generateEmailContent = (
  name,
  status,
  fromDate,
  toDate,
  comments,
  who
) => {
  return `
    <div style="padding: 20px;">
      <p>Dear ${name},</p>
      <p>Your request has been <strong>${status}</strong> by ${who}.</p>
      <p><strong>From:</strong> ${new Date(fromDate).toLocaleDateString()}</p>
      <p><strong>To:</strong> ${new Date(toDate).toLocaleDateString()}</p>
      <p><strong>Comments:</strong> ${comments || "No comments provided"}</p>
    </div>
  `;
};

export const notifyLeaveRequestStatus = async (
  email,
  name,
  status,
  fromDate,
  toDate,
  comments,
  who
) => {
  const emailSubject = `Leave Request ${
    status.charAt(0).toUpperCase() + status.slice(1)
  } by ${who}`;
  const emailContent = generateEmailContent(
    name,
    status,
    fromDate,
    toDate,
    comments,
    who
  );

  await sendEmail(email, emailSubject, emailContent);
};

export const notifyOdRequestStatus = async (
  email,
  name,
  status,
  fromDate,
  toDate,
  comments,
  who
) => {
  const emailSubject = `OD Request ${
    status.charAt(0).toUpperCase() + status.slice(1)
  } by ${who}`;
  const emailContent = generateEmailContent(
    name,
    status,
    fromDate,
    toDate,
    comments,
    who
  );

  await sendEmail(email, emailSubject, emailContent);
};

const generateRequestsTable = (requests, isOd, isDefaulter) => {
  if (!Array.isArray(requests) || requests.length === 0) {
    return `
      <div class="no-data">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        <p>No requests found</p>
      </div>
    `;
  }

  const getStatusBadge = (status) => {
    const statusClass =
      status.toLowerCase() === "approved"
        ? "status-approved"
        : status.toLowerCase() === "pending"
        ? "status-pending"
        : "status-rejected";

    return `<span class="status-badge ${statusClass}">${status}</span>`;
  };

  const headerRow = `
    <tr>
      <th>Name</th>
      <th>Roll No</th>
      <th>${!isDefaulter ? "Date(s)" : "Entry Date"}</th>
      <th>${isDefaulter || isOd ? "Type" : "Reason"}</th>
      <th>${
        !isDefaulter && isOd
          ? "Event Details"
          : !isDefaulter
          ? "Status"
          : "Details"
      }</th>
      ${isOd ? "<th>Status</th>" : ""}
    </tr>
  `;

  const rows = requests
    .map(
      (req) => `
      <tr>
        <td>${req.name || "-"}</td>
        <td>${isDefaulter ? req.roll_no : req.rollNo || "-"}</td>
        <td>
          ${
            !isDefaulter
              ? `<div class="date-cell">
                <div class="date-main">${new Date(
                  req.fromDate
                ).toLocaleDateString()}</div>
                ${
                  req.toDate && req.fromDate !== req.toDate
                    ? `<div class="date-to">to ${new Date(
                        req.toDate
                      ).toLocaleDateString()}</div>`
                    : ""
                }
                <div class="days-count">${req.noOfDays || "-"} day${
                  req.noOfDays > 1 ? "s" : ""
                }</div>
               </div>`
              : `<div class="date-cell">
                <div class="date-main">${new Date(
                  req.entryDate
                ).toLocaleDateString()}</div>
               </div>`
          }
      </td>
        <td>
          <div class="type-cell">
            ${
              isOd
                ? `<span class="type-badge od">${req.odType || "-"}</span>`
                : isDefaulter
                ? `<span class="type-badge defaulter">${
                    req.defaulterType || "-"
                  }</span>`
                : `<span class="type-badge leave">${req.reason || "-"}</span>`
            }
          </div>
      </td>
        <td>
          ${
            !isDefaulter
              ? isOd
                ? req.odType === "External"
                  ? `<div class="event-details">
                    <div class="event-name">${req.eventName || "-"}</div>
                    <div class="college-name">at ${req.collegeName || "-"}</div>
                   </div>`
                  : `<div class="reason-text">${req.reason || "-"}</div>`
                : getStatusBadge(req.status)
              : req.defaulterType === "Late"
              ? `<div class="time-in">${req.timeIn}</div>`
              : req.defaulterType === "Discipline and Dresscode"
              ? `<div class="observation-text">${req.observation}</div>`
              : req.defaulterType === "Both"
              ? `<div class="both-details">
                      <div class="time-in">Time In: ${req.timeIn}</div>
                      <div class="observation-text">Observation: ${req.observation}</div>
                     </div>`
              : "-"
          }
      </td>
        ${isOd ? `<td>${getStatusBadge(req.status || "Pending")}</td>` : ""}
    </tr>
    `
    )
    .join("");

  return `
    <div class="table-container">
      <div class="table-header">
        <div class="table-title">
        ${isOd ? "OD Requests" : isDefaulter ? "Defaulters" : "Leave Requests"}
      </div>
      </div>
      <div class="table-wrapper">
        <table>
          ${headerRow}
          ${rows}
        </table>
      </div>
    </div>
  `;
};

const sendHodConsolidatedEmails = async () => {
  try {
    // Find all HODs
    const hods = await Staff.find({ isHod: true }).lean();
    console.log(`Found ${hods.length} HODs`);

    // Fetch all types of requests
    const leaveRequests = await LeaveRequest.find()
      .populate({
        path: "userId",
        select: "batchId departmentId",
        populate: {
          path: "batchId",
          select: "batch_name",
        },
      })
      .populate("sectionId")
      .lean();

    const odRequests = await ODRequest.find()
      .populate({
        path: "studentId",
        select: "batchId departmentId",
        populate: {
          path: "batchId",
          select: "batch_name",
        },
      })
      .populate("sectionId")
      .lean();

    const defaulterRequests = await Defaulter.find()
      .populate({
        path: "studentId",
        select: "batchId departmentId",
        populate: {
          path: "batchId",
          select: "batch_name",
        },
      })
      .populate("sectionId")
      .lean();

    console.log(
      `HOD: Found ${leaveRequests.length} leave requests, ${odRequests.length} OD requests, and ${defaulterRequests.length} defaulter requests`
    );

    // Process for each HOD
    for (const hod of hods) {
      // Filter requests by department
      const deptLeaves = leaveRequests.filter(
        (req) =>
          req.userId?.departmentId?.toString() ===
          hod.staff_handle_dept?.toString()
      );

      const deptODs = odRequests.filter(
        (req) =>
          req.studentId?.departmentId?.toString() ===
          hod.staff_handle_dept?.toString()
      );

      const deptDefaulters = defaulterRequests.filter(
        (req) =>
          req.studentId?.departmentId?.toString() ===
          hod.staff_handle_dept?.toString()
      );

      // Group by batch and section
      const batchSectionRequests = {};

      // Helper function to initialize batch and section
      const initializeBatchSection = (request, batchId, sectionId) => {
        if (!batchSectionRequests[batchId]) {
          batchSectionRequests[batchId] = {
            batchName:
              request.userId?.batchId?.batch_name ||
              request.studentId?.batchId?.batch_name ||
              "No Batch",
            sections: {},
          };
        }

        if (!batchSectionRequests[batchId].sections[sectionId]) {
          batchSectionRequests[batchId].sections[sectionId] = {
            sectionName: request.sectionId?.section_name || "No Section",
            leaves: [],
            ods: [],
            defaulters: [],
          };
        }
      };

      // Process leave requests
      deptLeaves.forEach((request) => {
        const batchId =
          request.userId?.batchId?.batch_name?.toString() || "noBatch";
        const sectionId =
          request.sectionId?.section_name?.toString() || "noSection";
        initializeBatchSection(request, batchId, sectionId);
        batchSectionRequests[batchId].sections[sectionId].leaves.push(request);
      });

      // Process OD requests
      deptODs.forEach((request) => {
        const batchId =
          request.studentId?.batchId?.batch_name?.toString() || "noBatch";
        const sectionId =
          request.sectionId?.section_name?.toString() || "noSection";
        initializeBatchSection(request, batchId, sectionId);
        batchSectionRequests[batchId].sections[sectionId].ods.push(request);
      });

      // Process defaulter requests
      deptDefaulters.forEach((request) => {
        const batchId =
          request.studentId?.batchId?.batch_name?.toString() || "noBatch";
        const sectionId =
          request.sectionId?.section_name?.toString() || "noSection";
        initializeBatchSection(request, batchId, sectionId);
        batchSectionRequests[batchId].sections[sectionId].defaulters.push(
          request
        );
      });

      // Generate email content
      let emailContent = `<h2>Dear ${hod.staff_name},</h2>`;
      emailContent += `<p>Here is the consolidated summary of student requests for your department:</p>`;

      // Sort and display content
      const sortedBatches = Object.entries(batchSectionRequests).sort((a, b) =>
        a[1].batchName.localeCompare(b[1].batchName)
      );

      for (const [batchId, batch] of sortedBatches) {
        emailContent += `<div class="section-header">Batch: ${batch.batchName}</div>`;

        const sortedSections = Object.entries(batch.sections).sort((a, b) =>
          a[1].sectionName.localeCompare(b[1].sectionName)
        );

        for (const [sectionId, section] of sortedSections) {
          emailContent += `<div class="section-header">Section: ${section.sectionName}</div>`;

          // Leave Requests
          if (section.leaves.length > 0) {
            emailContent += generateRequestsSection(
              section.leaves,
              false,
              false
            );
          }

          // OD Requests
          if (section.ods.length > 0) {
            emailContent += generateRequestsSection(section.ods, true, false);
          }

          // Defaulter Records
          if (section.defaulters.length > 0) {
            emailContent += generateRequestsSection(
              section.defaulters,
              false,
              true
            );
          }
        }
      }

      const html = generateEmailTemplate(
        `Department Requests Summary - ${hod.staff_name}`,
        emailContent
      );

      // Send email without Excel attachment
      await sendEmailWithAttachments(
        hod.staff_mail,
        `Department Requests Summary`,
        html
      );

      console.log(
        `Summary email sent to HOD ${hod.staff_name} (${hod.staff_mail})`
      );
    }
  } catch (error) {
    console.error("Error sending HOD consolidated emails:", error);
  }
};

const sendStaffConsolidatedEmails = async () => {
  try {
    // Fetch all leave requests
    const leaveRequests = await LeaveRequest.find()
      .populate({
        path: "userId",
        select: "batchId",
      })
      .populate("mentorId")
      .populate("classInchargeId")
      .populate("sectionId")
      .lean();

    console.log(`Found ${leaveRequests.length} leave requests`);

    // Fetch all OD requests
    const odRequests = await ODRequest.find()
      .populate({
        path: "studentId",
        select: "batchId",
      })
      .populate("mentorId")
      .populate("classInchargeId")
      .populate("sectionId")
      .lean();

    console.log(`Found ${odRequests.length} OD requests`);

    const defaulterRequests = await Defaulter.find()
      .populate("studentId")
      .populate("sectionId")
      .populate("mentorId")
      .populate("classInchargeId")
      .lean();

    console.log("defaulterRequests", defaulterRequests);

    const staffRequests = {};

    // Process leave requests
    leaveRequests.forEach((request) => {
      const mentorId = request.mentorId?._id?.toString();
      const classInchargeId = request.classInchargeId?._id?.toString();

      if (mentorId) {
        if (!staffRequests[mentorId]) {
          staffRequests[mentorId] = {
            email: request.mentorId.staff_mail,
            name: request.mentorId.staff_name,
            role: "Mentor",
            leaves: [],
            ods: [],
            defaulters: [],
          };
        }
        staffRequests[mentorId].leaves.push(request);
      }

      if (classInchargeId) {
        if (!staffRequests[classInchargeId]) {
          staffRequests[classInchargeId] = {
            email: request.classInchargeId.staff_mail,
            name: request.classInchargeId.staff_name,
            role: "Class Incharge",
            leaves: [],
            ods: [],
            defaulters: [],
          };
        }
        staffRequests[classInchargeId].leaves.push(request);
      }
    });

    // Process OD requests
    odRequests.forEach((request) => {
      const mentorId = request.mentorId?._id?.toString();
      const classInchargeId = request.classInchargeId?._id?.toString();

      if (mentorId) {
        if (!staffRequests[mentorId]) {
          staffRequests[mentorId] = {
            email: request.mentorId.staff_mail,
            name: request.mentorId.staff_name,
            role: "Mentor",
            leaves: [],
            ods: [],
            defaulters: [],
          };
        }
        staffRequests[mentorId].ods.push(request);
      }

      if (classInchargeId) {
        if (!staffRequests[classInchargeId]) {
          staffRequests[classInchargeId] = {
            email: request.classInchargeId.staff_mail,
            name: request.classInchargeId.staff_name,
            role: "Class Incharge",
            leaves: [],
            ods: [],
            defaulters: [],
          };
        }
        staffRequests[classInchargeId].ods.push(request);
      }
    });

    // Process defaulter requests
    defaulterRequests.forEach((request) => {
      const mentorId = request.mentorId?._id?.toString();
      const classInchargeId = request.classInchargeId?._id?.toString();

      if (mentorId) {
        if (!staffRequests[mentorId]) {
          staffRequests[mentorId] = {
            email: request.mentorId.staff_mail,
            name: request.mentorId.staff_name,
            role: "Mentor",
            leaves: [],
            ods: [],
            defaulters: [],
          };
        }
        staffRequests[mentorId].defaulters.push(request);
      }

      if (classInchargeId) {
        if (!staffRequests[classInchargeId]) {
          staffRequests[classInchargeId] = {
            email: request.classInchargeId.staff_mail,
            name: request.classInchargeId.staff_name,
            role: "Class Incharge",
            leaves: [],
            ods: [],
            defaulters: [],
          };
        }
        staffRequests[classInchargeId].defaulters.push(request);
      }
    });

    // Send emails to each staff member
    for (const staffId in staffRequests) {
      const { email, name, role, leaves, ods, defaulters } =
        staffRequests[staffId];
      let emailContent = "";

      emailContent += `<h2>Dear ${name} (${role}),</h2>`;
      emailContent += `<p>Here is your daily summary of student requests:</p>`;

      // Add tables to email content
      if (leaves.length > 0)
        emailContent += generateRequestsSection(leaves, false, false);
      if (ods.length > 0)
        emailContent += generateRequestsSection(ods, true, false);
      if (defaulters.length > 0)
        emailContent += generateRequestsSection(defaulters, false, true);

      const html = generateEmailTemplate(
        `Daily Request Summary - ${role}`,
        emailContent
      );

      // Send email without Excel attachment
      await sendEmailWithAttachments(
        email,
        `Daily Request Summary - ${role}`,
        html
      );

      console.log(`Summary email sent to ${role} ${name} (${email})`);
    }

    console.log("All staff emails sent successfully");
  } catch (error) {
    console.error("Error sending staff consolidated emails:", error);
  }
};

// sendStaffConsolidatedEmails();
// sendHodConsolidatedEmails();
// console.log("Scheduled emails sent successfully");

export const scheduleEmails = () => {
  schedule.scheduleJob("10 9 * * *", async () => {
    console.log("Starting scheduled email sending...");
    try {
      await sendStaffConsolidatedEmails();
      await sendHodConsolidatedEmails();
      console.log("Scheduled emails sent successfully");
    } catch (error) {
      console.error("Error in scheduled email sending:", error);
    }
  });
};


scheduleEmails();
