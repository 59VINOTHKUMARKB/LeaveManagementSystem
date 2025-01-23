import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Award,
  BarChart,
  Bell,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

// New component for the particle animation
function ConstellationNetwork() {
  const [points, setPoints] = React.useState([]);
  const svgRef = React.useRef(null);

  React.useEffect(() => {
    const generatePoints = () => {
      const newPoints = [];
      const count = 50;
      for (let i = 0; i < count; i++) {
        newPoints.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight * 0.7), // Keep within hero section
          vx: (Math.random() - 0.5) * 0.5, // Velocity X
          vy: (Math.random() - 0.5) * 0.5, // Velocity Y
        });
      }
      setPoints(newPoints);
    };

    generatePoints();
    const interval = setInterval(() => {
      setPoints((prevPoints) => {
        return prevPoints.map((point) => ({
          ...point,
          x: point.x + point.vx,
          y: point.y + point.vy,
          vx:
            point.x + point.vx < 0 || point.x + point.vx > window.innerWidth
              ? -point.vx
              : point.vx,
          vy:
            point.y + point.vy < 0 ||
            point.y + point.vy > window.innerHeight * 0.7
              ? -point.vy
              : point.vy,
        }));
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const getLines = () => {
    const lines = [];
    const maxDistance = 150;

    points.forEach((point, i) => {
      points.slice(i + 1).forEach((point2, j) => {
        const distance = Math.hypot(point.x - point2.x, point.y - point2.y);
        if (distance < maxDistance) {
          const opacity = (maxDistance - distance) / maxDistance;
          lines.push({
            x1: point.x,
            y1: point.y,
            x2: point2.x,
            y2: point2.y,
            opacity,
          });
        }
      });
    });

    return lines;
  };

  return (
    <div className="absolute inset-0 z-0">
      <svg ref={svgRef} className="w-full h-[70vh]">
        {getLines().map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: line.opacity }}
            transition={{ duration: 0.5 }}
          />
        ))}
        {points.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="2"
            fill="rgba(59, 130, 246, 0.5)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </svg>
    </div>
  );
}

function HomePage() {
  const { currentUser } = useSelector((state) => state.user);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      icon: <Calendar size={24} />,
      title: "Leave Management",
      text: "Streamlined leave application process with automated tracking and approvals",
    },
    {
      icon: <Award size={24} />,
      title: "OD Management",
      text: "Efficient handling of On-Duty requests for academic and professional activities",
    },
    {
      icon: <UserCheck size={24} />,
      title: "Defaulter Management",
      text: "Systematic tracking of attendance and disciplinary records",
    },
    {
      icon: <ClipboardCheck size={24} />,
      title: "Real-time Processing",
      text: "Instant updates on request status and approvals",
    },
    {
      icon: <Bell size={24} />,
      title: "Smart Notifications",
      text: "Automated alerts for status changes and pending actions",
    },
    {
      icon: <BarChart size={24} />,
      title: "Analytics & Reports",
      text: "Comprehensive reports and insights for better decision-making",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-blue-900 relative overflow-hidden">
      <ConstellationNetwork />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center">
        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1
              className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              VCET Connect
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              A comprehensive academic management platform designed for VCET's
              ecosystem. Streamline administrative processes, enhance
              communication, and maintain transparency across all departments.
            </motion.p>

            {currentUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  to={
                    currentUser.userType === "Staff"
                      ? "/staffdashboard"
                      : currentUser.userType === "Student"
                      ? "/profile"
                      : "/hoddash"
                  }
                  className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {currentUser.userType === "Staff"
                    ? "Access Dashboard"
                    : currentUser.userType === "Student"
                    ? "View Profile"
                    : "HOD Dashboard"}
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            )}
          </div>
          {!currentUser && (
            <>
              {/* Scroll Indicator */}
              <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
              >
                <ArrowDown className="text-blue-600 dark:text-blue-400 w-6 h-6" />
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Comprehensive Management System
            </motion.h2>
            <motion.p
              className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
            >
              Experience a unified platform that integrates various academic
              processes into one seamless system.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Image Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <p className="text-gray-600 dark:text-gray-400">
                Experience a unified platform that integrates leave management,
                OD requests, and defaulter tracking with real-time updates and
                comprehensive analytics. Designed specifically for VCET's
                academic ecosystem.
              </p>
              <ul className="space-y-4">
                <motion.li
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <span className="p-1 bg-green-100 rounded-full text-green-600">
                    <CheckCircle size={16} />
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Seamless Integration
                  </span>
                </motion.li>
                <motion.li
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <span className="p-1 bg-green-100 rounded-full text-green-600">
                    <CheckCircle size={16} />
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Real-time Updates
                  </span>
                </motion.li>
                <motion.li
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <span className="p-1 bg-green-100 rounded-full text-green-600">
                    <CheckCircle size={16} />
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Comprehensive Analytics
                  </span>
                </motion.li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  className="w-full h-[500px] object-cover transform hover:scale-110 transition-transform duration-1000"
                  src="https://content3.jdmagicbox.com/comp/madurai/31/0452p452std2000631/catalogue/velammal-college-of-engineering-and-technology-munichalai-road-madurai-engineering-colleges-dxevz9.jpg"
                  alt="Velammal College of Engineering and Technology"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
