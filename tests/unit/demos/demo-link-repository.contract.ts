import { beforeEach, describe, expect, it } from "vitest";
import type { DemoLinkRepository } from "@/features/demos/demo-link-repository";

/**
 * The behaviour every demo link repository must have. The in-memory fake and the Drizzle
 * implementation both run this, so the test double cannot drift from the real storage.
 */
export type RepositoryHarness = {
  repository: DemoLinkRepository;
  reset: () => Promise<void>;
};

export function describeDemoLinkRepository(
  label: string,
  createHarness: () => RepositoryHarness | Promise<RepositoryHarness>,
): void {
  describe(`${label} demo link repository`, () => {
    let harness: RepositoryHarness;

    beforeEach(async () => {
      harness = await createHarness();
      await harness.reset();
    });

    it("lists only the active links for the requested exercises", async () => {
      // Arrange
      await harness.repository.upsertActive({
        exerciseId: "contract-a",
        videoId: "AAAAAAAAAAA",
        sourceTitle: "Title A",
      });
      await harness.repository.upsertActive({
        exerciseId: "contract-b",
        videoId: "BBBBBBBBBBB",
        sourceTitle: "Title B",
      });

      // Act
      const links = await harness.repository.listActiveByExerciseIds(["contract-a", "contract-c"]);

      // Assert
      expect(links).toHaveLength(1);
      expect(links[0]).toMatchObject({
        exerciseId: "contract-a",
        videoId: "AAAAAAAAAAA",
        active: true,
      });
    });

    it("makes a newer link the only active one for its exercise", async () => {
      // Arrange
      await harness.repository.upsertActive({
        exerciseId: "contract-a",
        videoId: "AAAAAAAAAAA",
        sourceTitle: "Old",
      });

      // Act
      await harness.repository.upsertActive({
        exerciseId: "contract-a",
        videoId: "CCCCCCCCCCC",
        sourceTitle: "New",
      });

      // Assert
      const links = await harness.repository.listActiveByExerciseIds(["contract-a"]);
      expect(links).toHaveLength(1);
      expect(links[0]).toMatchObject({ videoId: "CCCCCCCCCCC", sourceTitle: "New" });
    });

    it("drops an exercise from the list once its link is deactivated", async () => {
      // Arrange
      await harness.repository.upsertActive({
        exerciseId: "contract-a",
        videoId: "AAAAAAAAAAA",
        sourceTitle: "Title A",
      });

      // Act
      await harness.repository.deactivate("contract-a");

      // Assert
      expect(await harness.repository.listActiveByExerciseIds(["contract-a"])).toEqual([]);
    });

    it("returns an empty list when no exercise ids are requested", async () => {
      // Act / Assert
      expect(await harness.repository.listActiveByExerciseIds([])).toEqual([]);
    });
  });
}
