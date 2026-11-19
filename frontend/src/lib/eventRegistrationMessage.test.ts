import { describe, expect, it } from "vitest";
import { eventRegistrationSuccessMessage } from "./eventRegistrationMessage";

describe("event registration confirmation", () => {
  it("shows the exact success message after registering", () => {
    expect(eventRegistrationSuccessMessage(true, "HackMRSPTU 2026")).toBe("You are registered");
  });

  it("identifies the event when a registration is cancelled", () => {
    expect(eventRegistrationSuccessMessage(false, "HackMRSPTU 2026")).toBe(
      "Registration cancelled for HackMRSPTU 2026",
    );
  });
});
