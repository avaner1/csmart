"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AppUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isAdmin: boolean;
  slackConnected: boolean;
  slackTeamName: string | null;
  autoMatchedBook: boolean;
  vertical: string | null;
  csManager: string | null;
  rhoCs: string | null;
}

const UserContext = createContext<{ user: AppUser | null; loading: boolean }>({
  user: null,
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser() {
  return useContext(UserContext);
}
