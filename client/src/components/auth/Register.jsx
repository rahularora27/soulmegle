import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  // Add more state variables as needed for form fields

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const API_BASE_URL = "http://localhost:8000";
      await axios.post(`${API_BASE_URL}/auth/register`, { username, password });
      navigate("/login");
    } catch (err) {
      console.error(err);

      if (err.response) {
        // Server responded with a status code out of 2xx range
        if (err.response.status === 409) {
          // Handle conflict error
          alert("User already exists. Please choose a different username.");
        } else {
          alert(`Error: ${err.response.data.error || "Registration failed"}`);
        }
      } else {
        // No response received (network error, etc.)
        alert("Error: Could not connect to the server.");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto p-6 bg-white rounded-2xl shadow-lg"
    >
      <h2 className="text-2xl font-semibold text-center mb-4">Register</h2>

      <label className="block mb-2">
        <span className="text-gray-700">Username:</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </label>

      <label className="block mb-4">
        <span className="text-gray-700">Password:</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Register
      </button>
      <Link to="/login">Already have an account?</Link>
    </form>
  );
}

export default Register;
