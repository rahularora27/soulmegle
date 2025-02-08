import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App";
import Lobby from "./components/lobby/Lobby";
import NotFound from "./components/NotFound/NotFound";
import AuthProvider from "./AuthContext";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import PrivateRoute from "./PrivateRoute";

export default function Router() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<App />} />
          <Route path="*" element={<NotFound />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Lobby />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
