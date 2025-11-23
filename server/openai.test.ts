import { describe, expect, it } from "vitest";

describe("OpenAI API Key Validation", () => {
  it("should have valid OpenAI API key", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    
    // Test API key by making a simple API call
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  }, 10000); // 10 second timeout for API call
});
