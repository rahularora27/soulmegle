import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-200 font-sans px-4">
      <h1 className="text-6xl font-extrabold mb-4 text-white drop-shadow-md">
        404 - Page Not Found
      </h1>
      <p className="text-lg text-gray-400 text-center max-w-md bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        Oops! The page you're looking for might be under construction or doesn't
        exist.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-md 
                   hover:bg-purple-700 transition transform duration-300 ease-in-out 
                   hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 
                   focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
