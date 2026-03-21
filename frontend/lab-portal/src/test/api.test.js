import { api, isGateError } from "../services/api";
import { auth } from "../firebase/firebase";

describe("lab api request interceptor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds bearer token when firebase user exists", async () => {
    const getIdToken = vi.fn().mockResolvedValue("token-123");
    auth.currentUser = { getIdToken };

    const fulfilled = api.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };

    const next = await fulfilled(config);

    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(next.headers.Authorization).toBe("Bearer token-123");
  });

  it("keeps headers unchanged when no firebase user exists", async () => {
    auth.currentUser = null;

    const fulfilled = api.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };

    const next = await fulfilled(config);

    expect(next.headers.Authorization).toBeUndefined();
  });
});

describe("isGateError", () => {
  it("returns true for LAB gate 403 errors", () => {
    const err = {
      response: {
        status: 403,
        data: { error: "Waiting for admin approval" },
      },
    };

    expect(isGateError(err)).toBe(true);
  });

  it("returns false for non-gate errors", () => {
    const err = {
      response: {
        status: 500,
        data: { error: "Server Error" },
      },
    };

    expect(isGateError(err)).toBe(false);
  });
});
