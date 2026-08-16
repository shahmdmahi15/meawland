import Image from "next/image";
import type { Metadata } from "next";
import { LoginForm } from "@/components/root/login/login-form";

export const metadata: Metadata = {
  title: "Account Login & Sign Up | Meawland",
  description:
    "Log into your Meawland account with secure instant OTP or Google login to manage your pet orders, addresses, and wishlist.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 px-4 pt-24 pb-8 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="flex justify-center lg:justify-end order-2 lg:order-1">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-100">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-4xl sm:text-5xl font-chewy text-gray-900">
                  Log in
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Sign in or create an account
                </p>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center order-1 lg:order-2 space-y-6">
          <div className="space-y-3 flex flex-col items-center justify-center">
            <h2 className="text-5xl font-semibold tracking-tight text-slate-900 text-center">
              Welcome to <span className="font-chewy">MEAWLAND</span>
            </h2>
          </div>
          <Image
            src="/login-cat.gif"
            alt="Cute cat mascot"
            height={500}
            width={500}
            className="h-120 w-120 rounded-2xl"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
