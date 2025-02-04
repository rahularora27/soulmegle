import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "/logo.svg";

export default function Lobby() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SERVER_URL);
    setSocket(newSocket);

    newSocket.on("online", (count) => {
      setOnlineUsers(count);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const redirect = () => {
    if (socket) {
      socket.disconnect();
    }
    navigate("/home");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 w-full max-w-6xl mx-auto">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="SoulMegle Logo" className="h-12 w-12" />
          <span className="text-3xl font-bold text-white">SoulMegle</span>
        </div>
        <div className="text-lg md:text-xl bg-gray-800 px-4 py-2 rounded-lg shadow-md">
          {onlineUsers} users online
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col flex-grow justify-center items-center px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
          SoulMegle - Talk to Strangers
        </h2>
        <button
          onClick={redirect}
          className="px-8 py-4 bg-purple-600 text-white font-bold rounded-xl shadow-lg 
                 hover:bg-purple-700 transition transform duration-300 ease-in-out 
                 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 
                 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Connect
        </button>
      </div>
    </div>
  );
}
