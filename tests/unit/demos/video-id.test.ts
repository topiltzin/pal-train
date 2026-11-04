import { describe, expect, it } from "vitest";
import { buildEmbedUrl, isValidVideoId, shortsPageUrl } from "@/features/demos/video-id";

describe("isValidVideoId", () => {
  it("accepts an 11-character id of letters, digits, underscore, and hyphen", () => {
    // Arrange
    const id = "IFzYdoNYJkY";

    // Act / Assert
    expect(isValidVideoId(id)).toBe(true);
    expect(isValidVideoId("a_b-C_d-E12")).toBe(true);
  });

  it("rejects ids that are too short or too long", () => {
    // Act / Assert
    expect(isValidVideoId("IFzYdoNYJk")).toBe(false);
    expect(isValidVideoId("IFzYdoNYJkYX")).toBe(false);
  });

  it("rejects a full URL, spaces, and quotes", () => {
    // Act / Assert
    expect(isValidVideoId("https://www.youtube.com/shorts/IFzYdoNYJkY")).toBe(false);
    expect(isValidVideoId("IFzYdo NYJkY")).toBe(false);
    expect(isValidVideoId('IFzYdoNYJk"')).toBe(false);
  });
});

describe("buildEmbedUrl", () => {
  it("returns the privacy-enhanced embed URL for the id", () => {
    // Arrange
    const id = "IFzYdoNYJkY";

    // Act
    const url = buildEmbedUrl(id);

    // Assert
    expect(url).toBe(
      "https://www.youtube-nocookie.com/embed/IFzYdoNYJkY?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1",
    );
  });
});

describe("shortsPageUrl", () => {
  it("returns the Short's page on YouTube, used only for the fallback link", () => {
    // Act / Assert
    expect(shortsPageUrl("IFzYdoNYJkY")).toBe("https://www.youtube.com/shorts/IFzYdoNYJkY");
  });
});
