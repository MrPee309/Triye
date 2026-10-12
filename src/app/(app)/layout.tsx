import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { UserProvider } from "@/components/UserProvider";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { isAIConfigured } from "@/lib/ai";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: CurrentUser | null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) return <SetupNotice />;
    throw err;
  }
  // Valid cookie but the account is gone: clear the session.
  if (!user) redirect("/api/auth/logout");

  return (
    <UserProvider user={{ name: user.name, email: user.email, defaultCurrency: user.preferences.defaultCurrency, aiConfigured: isAIConfigured() }}>
      <AppShell userName={user.name}>{children}</AppShell>
    </UserProvider>
  );
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Baz done a poko konfigire</h1>
      <p className="mt-3 text-muted">
        Kopye <code className="rounded bg-white px-1">.env.example</code> nan{" "}
        <code className="rounded bg-white px-1">.env.local</code>, mete <code className="rounded bg-white px-1">MONGODB_URI</code>{" "}
        ou a, epi relanse sèvè a. Gade README a pou etap MongoDB Atlas yo.
      </p>
    </div>
  );
}
