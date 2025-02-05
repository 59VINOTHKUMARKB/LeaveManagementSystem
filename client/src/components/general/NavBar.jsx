import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import SideMenu from "../general/SideMenu";
import { signOutSuccess } from "../../redux/user/userSlice";
import { motion } from "framer-motion";
import { Menu, LogOut, Home, User, BookOpen } from "lucide-react";

function Navbar() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.user);

  const handleSignout = async () => {
    try {
      const res = await fetch("/api/auth/signout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signOutSuccess());
        navigate("/signin");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive(to)
          ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="/vcet.jpeg"
                alt="VCET Logo"
                className="w-10 h-10 rounded-full"
              />
              <span className="hidden md:inline font-semibold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-[#1f3a6e]">
                VCET Connect
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <NavLink to="/">
              <span className="flex items-center gap-2">
                <Home size={18} />
                Home
              </span>
            </NavLink>

            <NavLink to="/wardDetails">
              <span className="flex items-center gap-2">
                <BookOpen size={18} />
                Wards Detail
              </span>
            </NavLink>

            {currentUser ? (
              <>
                <NavLink
                  to={
                    currentUser.isHod
                      ? "/hoddash"
                      : currentUser.userType === "Staff"
                      ? "/staffdashboard"
                      : currentUser.userType === "Student"
                      ? "/studentdashboard"
                      : "/profile"
                  }
                >
                  <span className="flex items-center gap-2">
                    <User size={18} />
                    {currentUser.name.split(" ")[0]}
                  </span>
                </NavLink>

                <button
                  onClick={handleSignout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <NavLink to="/signin">
                <span className="flex items-center gap-2">
                  <User size={18} />
                  Sign In
                </span>
              </NavLink>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <SideMenu open={open} setOpen={setOpen} />
    </nav>
  );
}

export default Navbar;
