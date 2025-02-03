import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "/logo.svg";

export default function Lobby() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const newSocket = io("http://localhost:8000");
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
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-200">
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <img src={logo} alt="SoulMegle Logo" className="h-10 w-10 mr-2" />
          <span className="text-2xl font-bold text-white">SoulMegle</span>
        </div>
        <div className="text-xl">{onlineUsers} users online</div>
      </nav>

      <div className="flex flex-col flex-grow justify-center items-center px-4">
        <h2 className="text-5xl font-extrabold text-white mb-8 drop-shadow-md text-center">
          SoulMegle - Talk to Strangers
        </h2>
        <button
          onClick={redirect}
          className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-md 
                     hover:bg-purple-700 transition transform duration-300 ease-in-out 
                     hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 
                     focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Connect
        </button>
      </div>
    </div>
  );
}
