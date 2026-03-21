import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DoctorProtectedRoute from "../components/DoctorProtectedRoute";

describe("DoctorProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects to login when token is missing", () => {
    render(
      <MemoryRouter initialEntries={["/doctor/dashboard"]}>
        <Routes>
          <Route
            path="/doctor/dashboard"
            element={
              <DoctorProtectedRoute>
                <div>Protected Content</div>
              </DoctorProtectedRoute>
            }
          />
          <Route path="/doctor/login" element={<div>Doctor Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Doctor Login")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when token exists", () => {
    localStorage.setItem("access_token", "sample-token");

    render(
      <MemoryRouter initialEntries={["/doctor/dashboard"]}>
        <Routes>
          <Route
            path="/doctor/dashboard"
            element={
              <DoctorProtectedRoute>
                <div>Protected Content</div>
              </DoctorProtectedRoute>
            }
          />
          <Route path="/doctor/login" element={<div>Doctor Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Doctor Login")).not.toBeInTheDocument();
  });
});
