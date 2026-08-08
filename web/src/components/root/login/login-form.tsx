"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendLoginOtpAction } from "@/actions/auth/send-login-otp";
import { loginWithOtpAction } from "@/actions/auth/login-with-otp";
import { loginSchema, type LoginInput } from "@/schemas/auth/login";
import { loginOtpSchema, type LoginOtpInput } from "@/schemas/auth/login-otp";
import { useRouter } from "next/navigation";
import { loginWithGoogleAction } from "@/actions/auth/login-with-google";
import { toast } from "sonner";

type FormStatus = {
  status: "idle" | "success" | "error";
  message?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [otpStage, setOtpStage] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>({ status: "idle" });
  const [userId, setUserId] = useState<string | null>(null);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors, isSubmitting: isSendingOtp },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      email: "",
    },
    mode: "onTouched",
  });

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors, isSubmitting: isVerifyingOtp },
  } = useForm<LoginOtpInput>({
    resolver: zodResolver(loginOtpSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onTouched",
  });

  async function handleSendOtp(data: LoginInput) {
    setFormStatus({ status: "idle" });

    const response = await sendLoginOtpAction(data);

    setFormStatus({
      status: response.success ? "success" : "error",
      message:
        response.message ??
        (response.success
          ? "OTP sent successfully. Check your email."
          : "Unable to send OTP. Please try again."),
    });

    if (response.success) {
      setOtpStage(true);
      setUserId(response.userId || null);
      toast.success(response.message);
    }
  }

  async function handleVerifyOtp(data: LoginOtpInput) {
    setFormStatus({ status: "idle" });

    const response = await loginWithOtpAction(data, userId || "");

    setFormStatus({
      status: response.success ? "success" : "error",
      message:
        response.message ??
        (response.success
          ? "OTP verified successfully. You are now logged in."
          : "Unable to verify OTP. Please try again."),
    });

    if (response.success) {
      router.replace("/account");
      toast.success(response.message);
    }
  }

  return (
    <div className="space-y-6">
      {formStatus.status !== "idle" && formStatus.message ? (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm font-medium shadow-sm ${
            formStatus.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {formStatus.message}
        </div>
      ) : null}

      <div className="grid gap-5">
        <Button
          type="button"
          variant="outline"
          onClick={async () => await loginWithGoogleAction()}
          className="w-full justify-center gap-2 h-12 bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="100"
            height="100"
            viewBox="0 0 48 48"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            ></path>
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            ></path>
            <path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            ></path>
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            ></path>
          </svg>
          Continue with Google
        </Button>

        <div className="relative text-center text-sm font-medium text-slate-500">
          <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
          <span className="relative inline-flex bg-white px-3">or</span>
        </div>

        {!otpStage ? (
          <form
            noValidate
            onSubmit={handleSubmitLogin(handleSendOtp)}
            className="grid gap-5"
          >
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="name"
                  className="w-full h-12"
                  placeholder="Enter your name"
                  {...registerLogin("name")}
                />
                <FieldError errors={[loginErrors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  className="w-full h-12"
                  placeholder="Enter your email"
                  {...registerLogin("email")}
                />
                <FieldError errors={[loginErrors.email]} />
              </FieldContent>
            </Field>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? "Sending OTP..." : "Continue"}
            </Button>
          </form>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmitOtp(handleVerifyOtp)}
            className="grid gap-5"
          >
            <Field>
              <FieldLabel htmlFor="otp">OTP</FieldLabel>
              <FieldContent>
                <Input
                  id="otp"
                  className="w-full h-12"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Enter your OTP"
                  {...registerOtp("otp")}
                />
                <FieldError errors={[otpErrors.otp]} />
              </FieldContent>
            </Field>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
              disabled={isVerifyingOtp}
            >
              {isVerifyingOtp ? "Verifying OTP..." : "Continue"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
