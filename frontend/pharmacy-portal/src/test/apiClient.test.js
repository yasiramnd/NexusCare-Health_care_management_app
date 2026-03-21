import {
  apiFetch,
  getStoredRole,
  getStoredUserId,
  isPharmacyLoggedIn,
  pharmacyLogout,
} from "../api/client";

describe("pharmacy apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("attaches bearer token and returns JSON response", async () => {
    localStorage.setItem("ph_access_token", "abc123");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });

    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch("/api/pharmacy/me", { method: "GET" });

    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith("/api/pharmacy/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer abc123",
      },
    });
  });

  it("throws API error message when response is not ok", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ error: "Forbidden" }),
    });

    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/api/pharmacy/orders")).rejects.toThrow("Forbidden");
  });
});

describe("pharmacy auth helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns stored user and role", () => {
    localStorage.setItem("ph_user_id", "15");
    localStorage.setItem("ph_role", "PHARMACY");

    expect(getStoredUserId()).toBe("15");
    expect(getStoredRole()).toBe("PHARMACY");
  });

  it("detects logged in pharmacy user", () => {
    localStorage.setItem("ph_access_token", "token");
    localStorage.setItem("ph_role", "PHARMACY");

    expect(isPharmacyLoggedIn()).toBe(true);
  });

  it("clears pharmacy session on logout", () => {
    localStorage.setItem("ph_access_token", "token");
    localStorage.setItem("ph_refresh_token", "refresh");
    localStorage.setItem("ph_role", "PHARMACY");
    localStorage.setItem("ph_user_id", "15");

    pharmacyLogout();

    expect(localStorage.getItem("ph_access_token")).toBeNull();
    expect(localStorage.getItem("ph_refresh_token")).toBeNull();
    expect(localStorage.getItem("ph_role")).toBeNull();
    expect(localStorage.getItem("ph_user_id")).toBeNull();
  });
});
