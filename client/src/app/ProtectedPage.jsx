import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

function ProtectedPage() {
  const [message, setMessage] = useState("");
  const { authTokens } = useContext(AuthContext);

  useEffect(() => {
    axios
      .get("/protected", {
        headers: {
          Authorization: `Bearer ${authTokens}`,
        },
      })
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error("Error fetching protected data", error);
        setMessage("Failed to fetch protected data");
      });
  }, [authTokens]);

  return (
    <div>
      <h2>Protected Page</h2>
      <p>{message}</p>
    </div>
  );
}

export default ProtectedPage;
