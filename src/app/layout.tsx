import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CSMart",
  description: "Customer Success Manager Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1DB954",
          colorBackground: "#181818",
          colorText: "#FFFFFF",
          colorInputBackground: "#282828",
          colorInputText: "#FFFFFF",
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} antialiased bg-spotify-black`}>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
