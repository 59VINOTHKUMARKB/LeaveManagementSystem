import { Button, Modal, ModalBody, ModalHeader, Spinner } from "flowbite-react";
import { Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { MdOutlineDownloadDone } from "react-icons/md";
import { RxCross2, RxCrossCircled } from "react-icons/rx";
import { SiTicktick } from "react-icons/si";
import { TiTick } from "react-icons/ti";
import { useSelector } from "react-redux";
import StatusDot from "../../general/StatusDot";
import { GiConsoleController, GiMedicines } from "react-icons/gi";
import { ChevronRight } from "lucide-react";

export default function LeaveRequests({
  leaveRequestsAsMentor,
  leaveRequestsAsClassIncharge,
}) {
  const [classInchargemodalType, setClassInchargeModalType] = useState(null); // 'approve', 'reject', or 'taken'
  const [mentormodalType, setMentorModalType] = useState(null); // 'approve', 'reject', or 'taken'
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menteeRequests, setMenteeRequests] = useState(leaveRequestsAsMentor);
  const [classInchargeRequests, setClassInchargeRequests] = useState(
    leaveRequestsAsClassIncharge
  );
  const [isFetching, setIsFetching] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const [mentorComment, setmentorComment] = useState("");
  const [classInchargeComment, setclassInchargeComment] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const isStaffBothMentorAndCI =
    currentUser.isMentor && currentUser.isClassIncharge;
  const [activeTab, setActiveTab] = useState("pending");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month in two digits
    const day = date.getDate().toString().padStart(2, "0"); // Day in two digits
    return `${day}-${month}-${year}`;
  };

  // useEffect(() => {
  //   fetchLeaveRequestsMentor();
  // }, []);

  // useEffect(() => {
  //   fetchLeaveRequestsClassIncharge();
  // }, []);

  const handleRequest = (type, id) => {
    setMentorModalType(type);
    setCurrentRequestId(id);
  };

  const handleClose = () => {
    setMentorModalType(null);
    setCurrentRequestId(null);
  };

  const fetchLeaveRequestsMentor = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(
        `/api/getleaverequestbymentorid/${currentUser.userId}`
      );
      const data = await response.json();
      setMenteeRequests(data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchLeaveRequestsClassIncharge = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(
        `/api/getleaverequestbyclassinchargeid/${currentUser.userId}`
      );
      const data = await response.json();
      setClassInchargeRequests(data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleRequestClassIncharge = (type, id) => {
    setClassInchargeModalType(type);
    setCurrentRequestId(id);
  };

  const handleCloseClassIncharge = () => {
    setClassInchargeModalType(null);
    setCurrentRequestId(null);
  };

  const confirmRequestMentor = async () => {
    setLoading(true);
    try {
      const backendUrl = `/api/leave-requestsbymentorid/${currentRequestId}/status`;
      const requestBody = {
        status: mentormodalType,
        mentorcomment: mentorComment,
        isStaffBothRoles: isStaffBothMentorAndCI,
      };

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      // Refresh both lists to show updated status
      await Promise.all([
        fetchLeaveRequestsMentor(),
        fetchLeaveRequestsClassIncharge(),
      ]);
    } catch (error) {
      console.error("Error updating request:", error);
      alert(`Failed to update request: ${error.message}`);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const confirmRequestClass = async () => {
    setLoading(true);
    try {
      const backendUrl = `/api/leave-requestsbyclassinchargeid/${currentRequestId}/status`;
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: classInchargemodalType,
          classInchargeComment: classInchargeComment,
        }),
      });

      if (response.ok) {
        await fetchLeaveRequestsClassIncharge();
      } else {
        alert(`Failed to ${classInchargemodalType} request`);
      }
    } catch (error) {
      console.error("Error updating request:", error);
      alert(`Failed to ${classInchargemodalType} request`);
    } finally {
      setLoading(false);
      handleCloseClassIncharge();
    }
  };

  // Update the filtered class incharge requests logic
  const filteredClassInchargeRequests = classInchargeRequests.filter(
    (request) => {
      // If the staff is both mentor and CI for this student
      const isStaffMentorForStudent = menteeRequests.some(
        (menteeReq) => menteeReq._id === request._id
      );

      if (isStaffMentorForStudent) {
        const mentorStatus = request.approvals.mentor.status;
        // Show in CI section if mentor has taken action (either approved or rejected)
        return mentorStatus !== "pending";
      }

      // Show all requests where staff is only CI (not mentor)
      return true;
    }
  );

  // Update the isActionDisabled function
  const isActionDisabled = (request) => {
    if (currentUser.isClassIncharge) {
      // For CI view, disable actions if mentor rejected
      return request.approvals.mentor.status === "rejected";
    }
    return false; // Enable all actions for mentor
  };

  // Update the status display in renderRequestTable
  const getStatusDisplay = (request, role) => {
    const status = request.approvals[role].status;
    const mentorStatus = request.approvals.mentor.status;

    if (role === "classIncharge" && mentorStatus === "rejected") {
      return (
        <span className="px-4 py-1 rounded-full text-sm bg-red-100 text-red-600">
          Rejected
        </span>
      );
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm ${
          status === "approved"
            ? "bg-green-100 text-green-600"
            : status === "rejected"
            ? "bg-red-100 text-red-600"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Update the action buttons display
  const renderActionButtons = (request, role, handleRequest) => {
    const status = request.approvals[role].status;

    if (status === "pending" && !isActionDisabled(request)) {
      return (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() =>
              role === "mentor"
                ? handleRequest("approved", request._id)
                : handleRequestClassIncharge("approved", request._id)
            }
            className="bg-green-400 hover:bg-green-600 text-white p-1 rounded-full transition-all duration-300"
          >
            <TiTick size={30} />
          </button>
          <button
            onClick={() =>
              role === "mentor"
                ? handleRequest("rejected", request._id)
                : handleRequestClassIncharge("rejected", request._id)
            }
            className="bg-red-400 hover:bg-red-600 text-white p-1 rounded-full transition-all duration-300"
          >
            <RxCross2 size={30} />
          </button>
        </div>
      );
    }

    return getStatusDisplay(request, role);
  };

  // Add this component after the isActionDisabled function
  const MobileRequestCard = ({ request, role, onAction }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-gray-200">
                {request.name}
              </p>
              {request.forMedical && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  Medical
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {request.noOfDays} day(s) • {formatDate(request.fromDate)}
              {request.fromDate !== request.toDate &&
                ` to ${formatDate(request.toDate)}`}
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <ChevronRight
              size={20}
              className={`transform transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <StatusDot
              status={request.approvals.mentor.status}
              showLine={true}
              by="M"
            />
            <StatusDot
              status={request.approvals.classIncharge.status}
              showLine={false}
              by="CI"
            />
          </div>
          {request.approvals[role].status === "pending" &&
          !isActionDisabled(request) ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAction("approved", request._id)}
                className="bg-green-400 hover:bg-green-500 text-white p-1.5 rounded-full transition-all duration-300"
              >
                <TiTick size={20} />
              </button>
              <button
                onClick={() => onAction("rejected", request._id)}
                className="bg-red-400 hover:bg-red-500 text-white p-1.5 rounded-full transition-all duration-300"
              >
                <RxCross2 size={20} />
              </button>
            </div>
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-xs ${
                request.approvals[role].status === "approved"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {request.approvals[role].status.charAt(0).toUpperCase() +
                request.approvals[role].status.slice(1)}
            </span>
          )}
        </div>

        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reason</p>
              <p className="text-sm text-gray-900 dark:text-gray-200">
                {request.reason}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contact
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-200">
                {request.parent_phone}
              </p>
            </div>
            {/* {(request.mentorcomment !== "No Comments" ||
              request.classInchargeComment !== "No Comments") && ( */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Comments
              </p>
              <CommentsCell
                mentorcomment={request.mentorcomment}
                classInchargeComment={request.classInchargeComment}
                isBothRoles={isStaffBothMentorAndCI}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add this function to filter requests based on status
  const filterRequestsByStatus = (requests, role) => {
    return requests.filter((request) =>
      activeTab === "pending"
        ? request.approvals[role].status === "pending"
        : request.approvals[role].status !== "pending"
    );
  };

  // Update the renderRequestTable function to include mobile view
  const renderRequestTable = (requests, role, handleRequest) => {


    return (
      <>
        {/* Desktop view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-center">
                <th className="px-6 py-4 w-[18%]">Student</th>
                <th className="px-6 py-4 w-[18%]">Reason</th>
                <th className="px-6 py-4 w-[10%]">Phone</th>
                <th className="px-6 py-4 w-[15%]">Dates</th>
                <th className="px-6 py-4 w-[12%]">Status</th>
                <th className="px-6 py-4 w-[15%]">Comments</th>
                <th className="px-6 py-4 w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {requests.map((req) => {
                const { status } = req.approvals[role];
                return (
                  <tr
                    key={req._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-200">
                      {req.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-gray-600 dark:text-gray-300 line-clamp-2 capitalize ${
                            req.forMedical === true
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {req.reason}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowDetails(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Info
                            size={16}
                            className="text-gray-400 hover:text-gray-600"
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                      {req.parent_phone}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center min-w-max justify-center gap-2">
                        <span className="bg-blue-200 px-1 rounded-full text-xs">
                          {req.noOfDays}
                        </span>
                        {req.fromDate === req.toDate ? (
                          <div>{formatDate(req.fromDate)}</div>
                        ) : (
                          <div className="flex gap-2">
                            <div>{formatDate(req.fromDate)}</div>
                            <div>{formatDate(req.toDate)}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <StatusDot
                          status={req.approvals.mentor.status}
                          showLine={true}
                          by="M"
                        />
                        <StatusDot
                          status={req.approvals.classIncharge.status}
                          showLine={false}
                          by="CI"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CommentsCell
                        mentorcomment={req.mentorcomment}
                        classInchargeComment={req.classInchargeComment}
                        isBothRoles={isStaffBothMentorAndCI}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderActionButtons(req, role, handleRequest)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile view */}
        <div className="md:hidden space-y-4 p-4">
          {requests.map((request) => (
            <MobileRequestCard
              key={request._id}
              request={request}
              role={role}
              onAction={handleRequest}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="w-full mx-auto p-4">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Students Leave Requests
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View and manage leave requests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            activeTab === "pending"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pending Requests
        </button>
        <button
          onClick={() => setActiveTab("actionDone")}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            activeTab === "actionDone"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Action Done Requests
        </button>
      </div>

      {/* Mentor Requests Section */}
      {currentUser.isMentor && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold">
              {activeTab === "pending" ? "Pending" : "Action Done"} Leave
              Requests From Your Class Mentees
            </h2>
          </div>
          {filterRequestsByStatus(menteeRequests, "mentor").length > 0 ? (
            renderRequestTable(
              filterRequestsByStatus(menteeRequests, "mentor"),
              "mentor",
              handleRequest
            )
          ) : (
            <h2 className="font-semibold text-center p-6">
              No {activeTab === "pending" ? "Pending" : "Action Done"} Leave
              Requests from Your Mentees
            </h2>
          )}
        </div>
      )}

      {/* Class Incharge Requests Section */}
      {currentUser.isClassIncharge && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold">
              {activeTab === "pending" ? "Pending" : "Action Done"} Leave
              Requests From Your Class Students
            </h2>
          </div>
          {filterRequestsByStatus(
            filteredClassInchargeRequests,
            "classIncharge"
          ).length > 0 ? (
            renderRequestTable(
              filterRequestsByStatus(
                filteredClassInchargeRequests,
                "classIncharge"
              ),
              "classIncharge",
              handleRequestClassIncharge
            )
          ) : (
            <h2 className="font-semibold text-center p-6">
              No {activeTab === "pending" ? "Pending" : "Action Done"} Leave
              Requests from Your Students
            </h2>
          )}
        </div>
      )}

      {/* Mentor Modal */}
      <Modal
        show={mentormodalType !== null}
        size="md"
        onClose={handleClose}
        popup
      >
        <ModalHeader />
        <ModalBody>
          <h3 className="text-lg font-semibold mb-4">
            {mentormodalType === "approved" ? "Approve" : "Reject"} Request
            {isStaffBothMentorAndCI && " (as Mentor & Class Incharge)"}
          </h3>
          <div>
            <div className="mb-4">
              <label
                htmlFor="mentor_comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Add your comment
                {isStaffBothMentorAndCI && " (will apply for both roles)"}
              </label>
              <textarea
                id="mentor_comment"
                rows="4"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Write your comments..."
                onChange={(e) => setmentorComment(e.target.value)}
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button
                color={mentormodalType === "approved" ? "success" : "failure"}
                onClick={confirmRequestMentor}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Spinner size="sm" className="mr-2" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>
                    {mentormodalType === "approved" ? "Approve" : "Reject"}
                  </span>
                )}
              </Button>
              <Button color="gray" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* Class Incharge Modal */}
      <Modal
        show={classInchargemodalType !== null}
        size="md"
        onClose={handleCloseClassIncharge}
        popup
      >
        <ModalHeader />
        <ModalBody className="pt-3">
          <div className="text-center">
            {classInchargemodalType === "approved" ? (
              <SiTicktick className="mx-auto mb-4 h-14 w-14 text-green-500 dark:text-white" />
            ) : classInchargemodalType === "rejected" ? (
              <RxCrossCircled className="mx-auto mb-4 h-14 w-14 text-red-500 dark:text-white" />
            ) : (
              <MdOutlineDownloadDone className="mx-auto mb-4 h-14 w-14 text-secondary-blue dark:text-white" />
            )}

            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              {classInchargemodalType === "approved" ? (
                <div>
                  Are you to approve this request?
                  <div className="w-full my-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="px-4 py-2  rounded-t-lg dark:bg-gray-800">
                      <textarea
                        id="classIncharge_comment"
                        rows="4"
                        className="w-full px-0 text-sm text-gray-900 bg-white border-0  focus:ring-0 dark:text-white"
                        placeholder="Write your comments..."
                        onChange={(e) =>
                          setclassInchargeComment(e.target.value)
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
              ) : classInchargemodalType === "rejected" ? (
                <div>
                  Are you sure you want to reject this request?
                  <div className="w-full my-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
                      <textarea
                        id="classIncharge_comment"
                        rows="4"
                        className="w-full px-0 text-sm text-gray-900 bg-white border-0  focus:ring-0 dark:text-white"
                        placeholder="Write your comments..."
                        onChange={(e) =>
                          setclassInchargeComment(e.target.value)
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
              ) : (
                "This action has already been taken."
              )}
            </h3>
            {classInchargemodalType !== "taken" && (
              <div className="flex justify-center gap-4">
                <Button
                  color={
                    classInchargemodalType === "approved"
                      ? "success"
                      : "failure"
                  }
                  className={`${
                    classInchargemodalType === "approved"
                      ? "bg-green-500 hover:bg-green-500"
                      : "bg-red-500 hover:bg-red-500"
                  }`}
                  onClick={confirmRequestClass}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Spinner size="sm" className="mr-2" />
                      <span className="text-white">Loading...</span>
                    </div>
                  ) : (
                    <span className="text-white">
                      {classInchargemodalType === "approved"
                        ? "Approve"
                        : "Reject"}
                    </span>
                  )}
                </Button>
                <Button color="gray" onClick={handleCloseClassIncharge}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </ModalBody>
      </Modal>

      {/* Details Modal */}
      {selectedRequest && (
        <DetailsModal
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}
    </div>
  );
}

// Helper Components

const CommentsCell = ({ mentorcomment, classInchargeComment, isBothRoles }) => {
  return (
    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
      {mentorcomment ? (
        <div className="bg-gray-50 p-2 rounded">
          <p>
            <span className="font-semibold text-gray-700">Mentor:</span>{" "}
            {mentorcomment}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 p-2 rounded">
          <p>
            <span className="font-semibold text-gray-700">Mentor:</span> No
            Comments
          </p>
        </div>
      )}
      {classInchargeComment ? (
        <div className="bg-gray-50 p-2 rounded">
          <p>
            <span className="font-semibold text-gray-700">CI:</span>{" "}
            {classInchargeComment}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 p-2 rounded">
          <p>
            <span className="font-semibold text-gray-700">CI:</span> No Comments
          </p>
        </div>
      )}
    </div>
  );
};

const DetailsModal = ({ isOpen, onClose, request }) => (
  <Modal show={isOpen} onClose={onClose} size="lg">
    <Modal.Header>Leave Request Details</Modal.Header>
    <Modal.Body>
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Student Name" value={request.name} />
          <DetailItem label="Section" value={request.section_name} />
          <DetailItem
            label="Leave Type"
            value={
              request.typeOfLeave ||
              (request.forMedical ? "Medical Leave" : "Regular Leave")
            }
          />
          <DetailItem label="No. of Days" value={request.noOfDays} />
          <DetailItem
            label="From Date"
            value={new Date(request.fromDate).toLocaleDateString()}
          />
          <DetailItem
            label="To Date"
            value={new Date(request.toDate).toLocaleDateString()}
          />
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Leave Details */}
        <div>
          <h3 className="font-medium mb-2">Leave Details</h3>
          <DetailItem label="Reason" value={request.reason} />
          {request.isHalfDay && (
            <DetailItem
              label="Half Day"
              value={request.isHalfDay === "FN" ? "Forenoon" : "Afternoon"}
            />
          )}
          {request.forMedical && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <span className="bg-red-50 p-1 rounded">
                <GiMedicines className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">Medical Leave</span>
            </div>
          )}
        </div>

        {/* Approval Status */}
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Approval Status</h3>
          <div className="">
            <div className="flex">
              <StatusDot
                status={request.approvals.mentor.status}
                showLine={true}
                by="M"
              />
              <StatusDot
                status={request.approvals.classIncharge.status}
                showLine={false}
                by="CI"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button color="gray" onClick={onClose}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
);

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || "Not provided"}</p>
  </div>
);
