import React, { useState } from "react";
import eyeOpen from "../assets/eye-open.png";
import eyeClose from "../assets/eye-close.png";
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });
  const [ msg, setMsg ] = useState('');
  const [eye, setEye] = useState(true);
  const handleLogin = () => {
    if(formData.id === "ab23cd" && formData.password === "abc@123") {
      formData.id=""
      formData.password=""
      navigate('/home')
    } else {
      setMsg("Fill all details correctly")
    }
  };
  const handleEye = () => {
    setEye(!eye);
  };

  return (
    <div className="flex justify-center items-center h-screen ">
      <div className="flex flex-col md:w-2/6 rounded-xl shadow-2xl p-3 ">
        <p className="text-center text-2xl font-bold text-[#035450]">
          RTDD Login
        </p>
        <div className="flex flex-col mt-8 gap-4">
          <input
            type="text"
            placeholder="ID"
            required
            className="border-2 border-gray-300 h-12 rounded-md text-lg px-2"
            name="id"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          />
          {eye ? (
            <div className="flex w-full relative items-center">
              <input
                type="password"
                placeholder="Password"
                required
                className="border-2 border-gray-300 h-12 rounded-md text-lg px-2 w-full"
                name="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <img
                src={eyeOpen}
                className="w-6 h-6 absolute right-2 cursor-pointer "
                onClick={handleEye}
              />
            </div>
          ) : (
            <div className="flex w-full relative items-center">
              <input
                type="text"
                placeholder="Password"
                required
                className="border-2 border-gray-300 h-12 rounded-md text-lg px-2 w-full"
                name="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <img
                src={eyeClose}
                className="w-6 h-6 absolute right-2 cursor-pointer "
                onClick={handleEye}
              />
            </div>
          )}
        </div>
        <button
          className="flex mt-6 text-center bg-[#035450] text-white text-lg h-12 justify-center items-center rounded-md hover:bg-white hover:text-[#035450] hover:border-2 hover:border-[#035450]"
          onClick={handleLogin}
        >
          Login
        </button>
        <p className="text-red-500 text-center mt-3">{msg}</p>
      </div>
    </div>
  );
};

export default Login;
