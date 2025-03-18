import { useState } from "react";
import train from "../assets/train.png";
import { FaPowerOff, FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-[#035450] px-4 md:px-12 py-3 w-full flex flex-col md:flex-row items-center justify-between">

      <div className="flex items-center justify-between w-full md:w-1/3">
        <div className="flex items-center gap-1">
          <img
            src={train}
            className="invert brightness-200 w-12 h-12 md:w-16 md:h-16"
            alt="Train Logo"
          />
          <p className="text-lg md:text-2xl text-white font-semibold md:mt-5 mt-4">RTDD</p>
        </div>

        <button
          className="md:hidden text-white text-xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div
        className={`${
          menuOpen ? "flex" : "hidden"
        } md:flex flex-col md:flex-row w-full md:w-2/3 text-white font-semibold text-lg mt-3 md:mt-0`}
      >
        <div className="flex flex-col md:flex-row md:gap-6 w-full md:w-auto">
          <p className="cursor-pointer hover:bg-[#23827d] px-3 py-2 rounded-lg">
            Damaged_Track
          </p>
          <p className="cursor-pointer hover:bg-[#23827d] px-3 py-2 rounded-lg">
            Report
          </p>
        </div>

        <div className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded-lg cursor-pointer hover:bg-red-600 mt-3 md:mt-0 md:ml-auto text-center justify-center">
          <FaPowerOff size={20} color="white" />
          <p className="md:text-md text-sm text-white font-semibold">Logout</p>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
