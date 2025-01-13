import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

function HomePage() {
  const { currentUser } = useSelector((state) => state.user);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
      <div className="flex-1 flex justify-center bg-gradient-to-t from-blue-500 to-[#244784] p-6 shadow-lg">
        <div className="max-w-2xl md:max-w-3xl text-left">
              <h1 className="text-5xl font-bold tracking-wider text-white ">
                VCET Connect
              </h1>
          <p className="text-lg mt-5 leading-8  text-justify mb-8 text-secondary-white text-white indent-36">
            Manage your leave requests efficiently with our streamlined system
            designed for both students and staff. Whether you're submitting a
            new request, checking the status of previous requests, or exploring
            our policies, our platform ensures a smooth and transparent process.
            Experience real-time updates and seamless communication, tailored to
            enhance your leave management at Velammal College of Engineering and
            Technology.
          </p>
          <div className="grid items-center text-center">
            {currentUser ? (
              currentUser.userType === "Staff" ? (
                <Link
                  to="/staffdashboard"
                  className="bg-white text-black hover:bg-ternary-blue hover:text-black font-semibold rounded-full px-6 py-3 md:px-8 md:py-4 text-lg transition duration-300 shadow-black/60 shadow-sm hover:shadow-md transform  hover:scale-105"
                >
                  Leave Request Form
                </Link>
              ) : currentUser.userType === "Student" ? (
                <Link
                  to="/profile"
                  className=" bg-white text-black hover:bg-ternary-blue hover:text-black font-semibold rounded-full px-6 py-3 md:px-8 md:py-4 text-lg transition duration-300 shadow-black/60 shadow-sm hover:shadow-md transform  hover:scale-105"
                >
                  Leave Request Form
                </Link>
              ) : (
                <Link
                  to="/hoddash"
                  className=" bg-white font-semibold rounded-full p-2 text-lg transition duration-300 shadow-black shadow-md transform  hover:scale-105"
                >
                  View Dash Board
                </Link>
              )
            ) : null}
          </div>
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-white mb-4">Key Features</h1>
            <ul className="text-white text-lg space-y-2 list-disc list-inside"> 
              <li>Submit and track leave requests easily</li>
              <li>Apply for On-Duty permissions</li>
              <li>View attendance status</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 hidden lg:block  overflow-hidden">
        <img
          className="w-full h-full object-cover filter transition-all duration-1000 hover:scale-125"
          src="https://content3.jdmagicbox.com/comp/madurai/31/0452p452std2000631/catalogue/velammal-college-of-engineering-and-technology-munichalai-road-madurai-engineering-colleges-dxevz9.jpg"
          alt="Velammal College of Engineering and Technology"
        />
      </div>

      <div className="flex-1 flex justify-center bg-gradient-to-b from-blue-500 to-[#244784] items-center bg-secondary-white p-8">
        <div className="max-w-2xl md:max-w-3xl text-left">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-right text-white leading-tight">
            Why <span className="text-blue-400 text-6xl">Connect?</span>
          </h2>
          <ul className="text-lg leading-relaxed text-justify mb-8 text-white list-disc list-inside bg-white/20 bg-opacity-10 backdrop-blur-md border border-transparent rounded-lg shadow-md p-6">
            <li className="mb-4">
              <span className="text-white italic">Efficiency :</span> Our system
              simplifies the leave request and approval process, saving time and
              reducing paperwork.
            </li>
            <li className="mb-4">
              <span className="text-white italic">Real-Time Updates :</span> Get
              instant notifications on the status of your leave requests,
              ensuring you are always informed.
            </li>
            <li className="mb-4">
              <span className="text-white italic">
                User-Friendly Interface :
              </span>{" "}
              Designed with ease of use in mind, making it accessible for
              everyone.
            </li>
            <li className="mb-4">
              <span className="text-white italic">
                Comprehensive Policies :
              </span>{" "}
              Access to detailed leave policies and guidelines to ensure
              compliance and understanding.
            </li>
            <li className="mb-4">
              <span className="text-white italic">Secure :</span> Your data is
              protected with the highest standards of security and privacy.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
