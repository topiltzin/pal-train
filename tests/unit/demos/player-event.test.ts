import { describe, expect, it } from "vitest";
import { readPlayerEvent } from "@/features/demos/player-event";

describe("readPlayerEvent", () => {
  it("reads an onReady message sent as JSON text", () => {
    // Arrange
    const message = '{"event":"onReady","info":null,"channel":"widget","id":"p"}';

    // Act / Assert
    expect(readPlayerEvent(message)).toBe("ready");
  });

  it("reads an onReady message already parsed into an object", () => {
    // Act / Assert
    expect(readPlayerEvent({ event: "onReady" })).toBe("ready");
  });

  it("reads an onError message as a failure to play", () => {
    // Arrange: 152 is YouTube's code for a video that cannot be played in an embed
    const message = '{"event":"onError","info":152,"channel":"widget","id":"p"}';

    // Act / Assert
    expect(readPlayerEvent(message)).toBe("failed");
  });

  it("ignores other player messages, such as initialDelivery", () => {
    // Arrange
    const message = '{"event":"initialDelivery","info":{}}';

    // Act / Assert
    expect(readPlayerEvent(message)).toBeNull();
  });

  it("ignores text that is not JSON or has no event", () => {
    // Act / Assert
    expect(readPlayerEvent("not json")).toBeNull();
    expect(readPlayerEvent({ info: 1 })).toBeNull();
    expect(readPlayerEvent(null)).toBeNull();
  });
});
