import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { syncUser } from "@/lib/sync-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await syncUser();

  if (user && !user.slackConnected) {
    redirect("/setup");
  }

  return (
    <div className="min-h-screen bg-spotify-darkgray">
      <div className="h-1 bg-gradient-to-r from-spotify-green/80 to-spotify-green/20 fixed top-0 left-0 right-0 z-50" />
      <Sidebar />
      <main className="ml-60 pt-6 p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
