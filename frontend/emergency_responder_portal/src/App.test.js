import { render, screen } from "@testing-library/react";
import App from "./App";

describe("Emergency responder app", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("renders emergency profile fields for a valid patient", async () => {
    window.history.pushState({}, "", "/emergency/PT0002");

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        name: "John Doe",
        address: "Colombo",
        gender: "Male",
        contact_name: "Jane Doe",
        contact_phone: "0771234567",
        chronic_conditions: "Diabetes",
        blood_group: "O+",
        allergies: "Penicillin",
      }),
    });

    render(<App />);

    expect(await screen.findByText("Emergency Medical Profile", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("O+")).toBeInTheDocument();
  });

  it("shows not visible message when backend returns profile visibility restriction", async () => {
    window.history.pushState({}, "", "/emergency/PT0009");

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ message: "Profile not public visible" }),
    });

    render(<App />);

    expect(await screen.findByText("Profile is not visible")).toBeInTheDocument();
  });
});
