import { apiFetch, getStoredUserId } from "../api/client";

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("attaches bearer token and returns response JSON", async () => {
    localStorage.setItem("access_token", "abc123");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch("/api/doctor/me", { method: "GET" });

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith("/api/doctor/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer abc123",
      },
    });
  });

  it("throws server error message when request fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: "Unauthorized" }),
    });

    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/api/doctor/me")).rejects.toThrow("Unauthorized");
  });
});

describe("getStoredUserId", () => {
  it("returns user id from localStorage", () => {
    localStorage.setItem("user_id", "42");

    expect(getStoredUserId()).toBe("42");
  });
});
