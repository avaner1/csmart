import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">CSMart</h1>
        <p className="text-spotify-subtext mb-8">
          Sign in with your Spotify Google Workspace account
        </p>
        <SignIn />
      </div>
    </div>
  );
}
