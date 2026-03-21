import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PharmacyProtectedRoute from "../components/PharmacyProtectedRoute";

describe("PharmacyProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects to login when pharmacy session is missing", () => {
    render(
      <MemoryRouter initialEntries={["/pharmacy/dashboard"]}>
        <Routes>
          <Route
            path="/pharmacy/dashboard"
            element={
              <PharmacyProtectedRoute>
                <div>Pharmacy Dashboard</div>
              </PharmacyProtectedRoute>
            }
          />
          <Route path="/pharmacy/login" element={<div>Pharmacy Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Pharmacy Login")).toBeInTheDocument();
    expect(screen.queryByText("Pharmacy Dashboard")).not.toBeInTheDocument();
  });

  it("renders children when pharmacy session is valid", () => {
    localStorage.setItem("ph_access_token", "token");
    localStorage.setItem("ph_role", "PHARMACY");

    render(
      <MemoryRouter initialEntries={["/pharmacy/dashboard"]}>
        <Routes>
          <Route
            path="/pharmacy/dashboard"
            element={
              <PharmacyProtectedRoute>
                <div>Pharmacy Dashboard</div>
              </PharmacyProtectedRoute>
            }
          />
          <Route path="/pharmacy/login" element={<div>Pharmacy Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Pharmacy Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Pharmacy Login")).not.toBeInTheDocument();
  });
});
 