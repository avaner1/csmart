"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SetupGuard({
  slackConnected,
  children,
}: {
  slackConnected: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (slackConnected) {
      setChecked(true);
      return;
    }

    const skipped = localStorage.getItem("csmart_setup_complete");
    if (skipped) {
      setChecked(true);
    } else {
      router.replace("/setup");
    }
  }, [slackConnected, router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-spotify-darkgray flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
