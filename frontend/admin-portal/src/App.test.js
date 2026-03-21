import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

describe("Admin portal App", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn((url) => {
      if (String(url).includes("/admin/dashboard")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            totalPatients: 10,
            totalDoctors: 4,
            pendingRequests: 2,
            totalPharmacies: 3,
            totalLabs: 2,
            totalAppointments: 7,
          }),
        });
      }

      if (String(url).includes("/admin/doctors")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: "Dr. Sarah", license: "DOC-1", status: "Pending" },
          ]),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders dashboard stats after successful fetch", async () => {
    render(<App />);

    expect(await screen.findByText("System Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Total Patients")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("navigates to registration requests from sidebar", async () => {
    render(<App />);

    fireEvent.click(screen.getByText("Registration Requests"));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Registration Requests" })
      ).toBeInTheDocument();
    });

    expect(await screen.findByText("Dr. Sarah")).toBeInTheDocument();
  });
});
