import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">CSMart</h1>
        <p className="text-spotify-subtext mb-8">Create your account</p>
        <SignUp />
      </div>
    </div>
  );
}
