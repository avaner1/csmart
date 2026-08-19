import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/components/user-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CSmart",
  description: "Customer Success Manager Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-spotify-black`}>
        <UserProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
