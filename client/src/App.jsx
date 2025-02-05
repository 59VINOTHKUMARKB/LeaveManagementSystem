import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import SuperAdmin from "./pages/SuperAdmin";
import PageNotFound from "./pages/PageNotFound";
import StaffDashBoard from "./pages/StaffDashBoard";
import HomePage from "./pages/HomePage";
import Navbar from "./components/general/NavBar";
import PrivateRoute from "./components/auth/PrivateRoute";
import StaffPrivateRoute from "./components/auth/StaffPrivateRoute";
import PublicRoute from "./components/auth/PublicRoute";
import ProfilePage from "./pages/ProfilePage";
import LeaveRequestForm from "./components/systems/leave/LeaveRequestForm";
import DashBoard from "./pages/DashBoard";
import Hoddashboard from "./pages/HodDashBoard";
import HodPrivateRoute from "./components/auth/HodPrivateRoute";
import WardDetails from "./pages/WardDetails";
import SignIn from "./components/auth/SignIn";
import Footer from "./components/general/Footer";
import MailTiming from "./components/systems/MailTiming";
import About from "./pages/About";
import DepartmentReports from "./pages/DepartmentReports";

const AppWrapper = () => {
  const location = useLocation();

  const dashboardPages = [
    "/profile",
    "/staffdashboard",
    "/hoddash",
    "/superadmin",
  ];
  const showNavbar = !dashboardPages.includes(location.pathname);
  const showFooter = [
    "/",
    "/studentsignup",
    "/staffsignup",
    "/signin",
    "/wardDetails",
    "*",
  ].includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/signin" element={<SignIn />} />
        </Route>

        {/* Public Routes without authentication check */}
        <Route path="/" element={<HomePage />} />
        <Route path="/know-about-us" element={<About />} />
        <Route path="/hidden/changeMailTiming" element={<MailTiming />} />
        <Route path="/wardDetails" element={<WardDetails />} />
        <Route path="/superadmin" element={<SuperAdmin />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/studentdashboard" element={<DashBoard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leaverequest" element={<LeaveRequestForm />} />
        </Route>

        <Route element={<HodPrivateRoute />}>
          <Route path="/hoddash" element={<Hoddashboard />} />
          <Route path="/department-reports" element={<DepartmentReports />} />
        </Route>

        <Route element={<StaffPrivateRoute />}>
          <Route path="/staffdashboard" element={<StaffDashBoard />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
      {showFooter && <Footer />}
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AppWrapper />
  </BrowserRouter>
);

export default App;
