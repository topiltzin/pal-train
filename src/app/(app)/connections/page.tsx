import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/session";
import {
  createDrizzleConnectionRepository,
  type ConnectionSummary,
} from "@/features/mcp/connection-repository";
import { disconnectAction } from "./actions";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

function describeLastUse(lastUsedAt: Date | null): string {
  return lastUsedAt === null ? "never" : lastUsedAt.toLocaleString("en", DATE_FORMAT);
}

function ConnectionRow({ connection: row }: { connection: ConnectionSummary }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl p-4 mood-card">
      <p className="font-semibold">{row.clientName}</p>
      <p className="text-sm text-muted">
        Approved {row.approvedAt.toLocaleString("en", DATE_FORMAT)} · Last used{" "}
        {describeLastUse(row.lastUsedAt)}
      </p>
      {row.status === "active" ? (
        <form action={disconnectAction}>
          <input type="hidden" name="clientId" value={row.clientId} />
          <button
            type="submit"
            className="min-h-11 rounded-full px-5 text-sm font-semibold ring-1 ring-line"
          >
            Disconnect
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">
          Removed {row.removedAt?.toLocaleString("en", DATE_FORMAT) ?? ""}
        </p>
      )}
    </li>
  );
}

/** Lists the connected apps with their approval and last-use dates (spec US3). */
export default async function ConnectionsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const connections = await createDrizzleConnectionRepository().listForUser(user.sub);
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-bold">Connected apps</h1>
      {connections.length === 0 ? (
        <p className="text-muted">No apps are connected to your account.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {connections.map((row) => (
            <ConnectionRow key={row.clientId} connection={row} />
          ))}
        </ul>
      )}
    </main>
  );
}
