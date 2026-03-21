import { getApiBaseUrl, isUsingFallbackApiBase } from "../services/apiBase";

describe("apiBase", () => {
  it("returns configured API base when env value exists", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://lab.example.com///");
    vi.stubEnv("DEV", "false");

    expect(getApiBaseUrl()).toBe("https://lab.example.com");
    expect(isUsingFallbackApiBase()).toBe(false);
  });

  it("uses empty base in dev when no API base is configured", () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubEnv("DEV", "true");

    expect(getApiBaseUrl()).toBe("");
    expect(isUsingFallbackApiBase()).toBe(false);
  });

  it("reports no fallback when base is configured", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://custom.lab.base");
    expect(isUsingFallbackApiBase()).toBe(false);
  });
});
