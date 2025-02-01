import React from "react";
import { useNavigate } from "react-router-dom";

export default function Lobby() {
  const navigate = useNavigate();

  const redirect = () => {
    navigate("/home");
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-gray-200 px-4">
      <h1 className="text-6xl font-extrabold text-white mb-4 drop-shadow-md">
        SoulMegle
      </h1>
      <p className="text-lg text-gray-400 mb-10 bg-gray-800 p-6 rounded-lg shadow-lg">
        A website like Omegle
      </p>
      <button
        onClick={redirect}
        className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-md 
                   hover:bg-purple-700 transition transform duration-300 ease-in-out 
                   hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 
                   focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Start
      </button>
    </div>
  );
}
