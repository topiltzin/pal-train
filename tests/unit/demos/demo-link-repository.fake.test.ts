import { describeDemoLinkRepository } from "./demo-link-repository.contract";
import { createInMemoryDemoLinkRepository } from "@/features/demos/demo-link-repository";

describeDemoLinkRepository("in-memory", () => {
  const repository = createInMemoryDemoLinkRepository();
  return { repository, reset: async () => repository.clear() };
});
