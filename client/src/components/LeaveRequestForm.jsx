import React, { useEffect, useState } from "react";
import {
  TextInput,
  Label,
  Button,
  Select,
  Spinner,
  Checkbox,
} from "flowbite-react";
import { useSelector } from "react-redux";
import { ScaleLoader } from "react-spinners";

// TOFIX If end date not selected then set the end date as the start data bug fix

export default function LeaveRequestForm({ setTab }) {
  const { currentUser } = useSelector((state) => state.user);

  const isStaff = currentUser.userType === "Staff" || false;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [classIncharges, setClassIncharges] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([
    "Casual Leave",
    "Sick Leave",
    "Earned Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Study Leave",
    "Duty Leave",
    "Special Leave",
    "Sabbatical Leave",
  ]);
  const [forMedical, setForMedical] = useState(false);
  const [forOneDay, setForOneDay] = useState(false);
  const [isHalfDay, setIsHalfDay] = useState(null);
  const [noOfDays, setNoOfDays] = useState(0);

  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    userId:
      currentUser.userType === "Staff" ? currentUser.userId : currentUser.id,
    userType: currentUser.userType,
    rollNo:
      currentUser.userType === "Staff" ? currentUser.id : currentUser.roll_no,
    regNo: currentUser.register_no,
    forMedical,
    batchId: currentUser.batchId,
    sectionId: currentUser.sectionId,
    section_name: currentUser.section_name,
    departmentId: currentUser.departmentId,
    reason: "",
    classInchargeId: "",
    mentorId: "",
    leaveStartDate: "",
    leaveEndDate: "",
    isHalfDay: null,
    noOfDays: 0,
    typeOfLeave: "",
  });

  const handleForMedicalChange = (e) => {
    setForMedical(e.target.checked);
    setFormData({ ...formData, forMedical: e.target.checked });
  };

  const calculateDays = () => {
    const { leaveStartDate, leaveEndDate } = formData;

    if (!leaveStartDate || !leaveEndDate) return;

    const startDate = new Date(leaveStartDate);
    const endDate = new Date(leaveEndDate);

    let totalDays = 0;
    let isSecondSaturdayInRange = false;

    // Ensure startDate is not after endDate
    if (startDate > endDate) {
      console.error("Start date must not be after end date");
      return;
    }

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayOfWeek = date.getDay();

      // Exclude Sundays (0)
      if (dayOfWeek !== 0) {
        totalDays++;
      }

      // Check for the second Saturday
      if (dayOfWeek === 6) {
        // Saturday
        const firstDayOfMonth = new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        );
        const firstSaturday = new Date(firstDayOfMonth);
        firstSaturday.setDate(1 + ((6 - firstDayOfMonth.getDay() + 7) % 7));

        // Find the second Saturday of the month
        const secondSaturday = new Date(firstSaturday);
        secondSaturday.setDate(firstSaturday.getDate() + 7);

        if (
          date.getDate() === secondSaturday.getDate() &&
          date.getMonth() === secondSaturday.getMonth()
        ) {
          isSecondSaturdayInRange = true;
        }
      }
    }

    // If the leave range includes the second Saturday, don't count it
    if (isSecondSaturdayInRange) {
      totalDays--;
    }

    setNoOfDays(totalDays);

    // Calculate the total number of days inclusive
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const differenceInDays =
      Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1;

    setFormData((prevFormData) => ({
      ...prevFormData,
      noOfDays: totalDays,
      differenceInDays: differenceInDays,
    }));
  };

  useEffect(() => {
    if (forOneDay && formData.leaveStartDate) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        leaveEndDate: prevFormData.leaveStartDate,
      }));
    }
    calculateDays();
  }, [formData.leaveStartDate, formData.leaveEndDate, forOneDay]);

  useEffect(() => {
    fetch("/api/departments")
      .then((response) => response.json())
      .then((data) => setDepartments(data))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (formData.sectionId) {
      const fetchStaff = async () => {
        try {
          const resMentor = await fetch(
            `/api/sections/${formData.sectionId}/mentors`
          );
          const mentorsData = await resMentor.json();
          setMentors(mentorsData);

          const resClassIncharge = await fetch(
            `/api/sections/${formData.sectionId}/classIncharges`
          );
          const classInchargesData = await resClassIncharge.json();
          setClassIncharges(classInchargesData);

          // Set classInchargeId in formData
          if (classInchargesData.length > 0) {
            setFormData({
              ...formData,
              classInchargeId: classInchargesData[0]._id,
            });
          }
        } catch (error) {
          console.error(error);
        }
      };

      fetchStaff();
    } else {
      setMentors([]);
      setClassIncharges([]);
    }
  }, [formData.sectionId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForOneDayChange = (e) => {
    setForOneDay(e.target.checked);
    if (e.target.checked) {
      setFormData({ ...formData, leaveEndDate: formData.leaveStartDate });
    }
  };

  const handleIsHalfDayChange = (selectedOption) => {
    setIsHalfDay((prevIsHalfDay) =>
      prevIsHalfDay === selectedOption ? null : selectedOption
    );
    setFormData({
      ...formData,
      isHalfDay: isHalfDay === selectedOption ? null : selectedOption,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const currentDate = new Date().toISOString().split("T")[0];

    if (!formData.departmentId) {
      newErrors.departmentId = "Department must be selected";
    }

    if (!formData.leaveStartDate) {
      newErrors.leaveStartDate = "Date from must be selected";
    } else if (formData.leaveStartDate < currentDate) {
      newErrors.leaveStartDate = "Date from must not be in the past";
    }

    if (!forOneDay && !isHalfDay && !formData.leaveEndDate) {
      newErrors.leaveEndDate = "Date to must be selected";
    } else if (formData.leaveEndDate && formData.leaveEndDate < currentDate) {
      newErrors.leaveEndDate = "Date to must not be in the past";
    } else if (
      !forOneDay &&
      formData.leaveEndDate &&
      formData.leaveEndDate < formData.leaveStartDate
    ) {
      newErrors.leaveEndDate = "Date to must be greater than Date from";
    }
    if (!formData.reason) {
      newErrors.reason = "Reason must be given";
    } else if (formData.reason.length > 200) {
      newErrors.reason = "Reason must be less than 200 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    try {
      setLoading(true);
      setErrorMessage(null);
      const { classInchargeId, mentorId } = formData;
      const res = await fetch("/api/leave-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          toDate: forOneDay ? formData.leaveStartDate : formData.leaveEndDate,
          forMedical: forMedical ? true : false,
          mentorId: classInchargeId === mentorId ? null : mentorId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        if (
          data.message.includes("Leave end date must be after the start date")
        ) {
          setErrorMessage("Leave end date must be after the start date");
        } else if (
          data.message.includes(
            "You already have a leave request for this period"
          )
        ) {
          setErrorMessage("You already have a leave request for this period");
        } else {
          setErrorMessage(data.message);
        }
        setLoading(false);
        return;
      }
      if (res.ok) {
        setLoading(false);
        setTab("Your Leave Requests");
      }
    } catch (error) {
      setErrorMessage(
        "An error occurred while submitting the leave request. Please try again later."
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center md:mt-5">
      <div className="w-full max-w-2xl px-6 py-4 md:py-4 mx-auto h-auto ">
        <div
          className="bg-slate-200 shadow-lg
 rounded-md text-black px-6 py-3 font-sans md:mt-2"
        >
          <div className="flex justify-center mb-4">
            <h1 className="font-bold uppercase text-2xl px-6 py-2 tracking-widest">
              Request Leave
            </h1>
          </div>
          <form className="flex flex-col gap-3 " onSubmit={handleSubmit}>
            {!isStaff && (
              <div className="grid grid-cols-1 gap-4">
                <div className=" gap-3">
                  <h1 className="">
                    Your Class Incharge :{" "}
                    {classIncharges.length > 0
                      ? classIncharges[0].staff_name
                      : ""}
                  </h1>
                  {errors.classInchargeId && (
                    <p className="text-red-600 font-bold bg-white/80 w-max px-2 py-[0.5] rounded-lg text-xs italic">
                      {errors.classInchargeId}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Label
                    htmlFor="mentorId"
                    className="text-left font-semibold tracking-wide text-black"
                  >
                    Mentor Name<span className="text-red-400">*</span>
                  </Label>
                  <Select
                    name="mentorId"
                    value={formData.mentorId}
                    required
                    onChange={handleChange}
                    className={errors.mentorId ? "border-red-500" : ""}
                  >
                    <option value="">Select Mentor</option>
                    {mentors.map((mentor) => (
                      <option key={mentor._id} value={mentor._id}>
                        {mentor.staff_name}
                      </option>
                    ))}
                  </Select>
                  {errors.mentorId && (
                    <p className="text-red-600 font-bold bg-white/80 w-max px-2 py-[0.5] rounded-lg text-xs italic">
                      {errors.mentorId}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="leaveStartDate"
                  className="text-left text-black font-semibold tracking-wide text-wide"
                >
                  Date From<span className="text-red-400">*</span>
                </Label>
                <TextInput
                  type="date"
                  name="leaveStartDate"
                  value={formData.leaveStartDate}
                  onChange={handleChange}
                  className={errors.leaveStartDate ? "border-red-500" : ""}
                />
                {errors.leaveStartDate && (
                  <p className="text-red-600 font-bold bg-white/80 w-max px-2 py-[0.5] rounded-lg text-xs italic">
                    {errors.leaveStartDate}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="leaveEndDate"
                  className="text-left font-semibold tracking-wide text-black"
                >
                  Date To<span className="text-red-400">*</span>
                </Label>
                <TextInput
                  type="date"
                  name="leaveEndDate"
                  value={formData.leaveEndDate}
                  onChange={handleChange}
                  disabled={forOneDay}
                  className={errors.leaveEndDate ? "border-red-500" : ""}
                />
                {errors.leaveEndDate && (
                  <p className="text-red-600 font-bold bg-white/80 w-max px-2 py-[0.5] rounded-lg text-xs italic">
                    {errors.leaveEndDate}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="forOneDay"
                name="forOneDay"
                checked={forOneDay}
                onChange={handleForOneDayChange}
                className="text-blue-500 border-secondary-blue"
              />
              <Label htmlFor="forOneDay" className="text-black">
                Apply leave for one day only{" "}
              </Label>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="FN"
                  name="forHalfDay"
                  checked={isHalfDay === "FN"}
                  onChange={() => handleIsHalfDayChange("FN")}
                  className="text-blue-500 border-secondary-blue"
                />
                <Label htmlFor="FN" className="font-normal text-black">
                  FN
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="AN"
                  name="forHalfDay"
                  checked={isHalfDay === "AN"}
                  onChange={() => handleIsHalfDayChange("AN")}
                  className="text-blue-500 border-secondary-blue"
                />
                <Label htmlFor="AN" className="font-normal text-black">
                  AN
                </Label>
              </div>
              <Label htmlFor="forHalfDay" className="text-black">
                Select One in case of half day
              </Label>
            </div>

            {isStaff ? (
              <div className="flex flex-col">
                <Label
                  htmlFor="typeOfLeave"
                  className="mb-2 text-left font-bold tracking-wide text-black"
                >
                  Type of Leave<span className="text-red-400">*</span>
                </Label>
                <Select
                  id="typeOfLeave"
                  name="typeOfLeave"
                  value={formData.typeOfLeave}
                  onChange={handleChange}
                  className={` rounded-md py-2  text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    errors.typeOfLeave ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select Type of Leave</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
                {errors.typeOfLeave && (
                  <p className="text-red-600 font-bold bg-white/80 w-max px-2 py-[0.5] rounded-lg text-xs italic">
                    {errors.typeOfLeave}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="forMedical"
                  name="forMedical"
                  checked={forMedical}
                  onChange={handleForMedicalChange}
                  className="text-blue-500 border-secondary-blue"
                />
                <Label htmlFor="forMedical" className="text-black">
                  Is this for medical reason?
                </Label>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Label
                htmlFor="reason"
                className="text-left font-semibold tracking-wide text-black"
              >
                Reason<span className="text-red-400">*</span>
              </Label>
              <textarea
                name="reason"
                value={formData.reason}
                cols="30"
                rows="4"
                onChange={handleChange}
                className={`rounded-md ${
                  errors.reason ? "border-red-500" : ""
                } text-black`}
              ></textarea>
              {errors.reason && (
                <p className="text-red-600 font-bold bg-white/80 w-max px-2 py-[0.5] rounded-lg text-xs italic">
                  {errors.reason}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600   p-2 font-bold tracking-wide rounded-md transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center text-white   justify-center py-2">
                  <ScaleLoader color="white" height={15} />
                </div>
              ) : (
                <div className="flex items-center text-white justify-center py-2">
                  Submit Leave
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
