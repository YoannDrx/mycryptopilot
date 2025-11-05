"use client";

import { Typography } from "@/components/nowts/typography";
import { useCallback, useEffect, useState } from "react";
import { SignInWithEmailOTP } from "./_components/sign-in-otp-form";
import { SignInPasswordForm } from "./_components/sign-in-password-form";

export const SignInCredentialsAndMagicLinkForm = (props: {
  callbackUrl?: string;
}) => {
  const [isUsingCredentials, setIsUsingCredentials] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(
        "sign-in-with-credentials",
      );
      if (storedValue !== null) {
        setIsUsingCredentials(storedValue === "true");
      }
    } catch {
      // Ignore storage access errors (e.g., disabled storage)
    }
  }, []);

  const persistPreference = useCallback((value: boolean) => {
    setIsUsingCredentials(value);
    try {
      window.localStorage.setItem(
        "sign-in-with-credentials",
        value ? "true" : "false",
      );
    } catch {
      // Ignore storage access errors (e.g., disabled storage)
    }
  }, []);

  if (!isUsingCredentials) {
    return (
      <div className="max-w-lg space-y-4">
        <SignInWithEmailOTP callbackUrl={props.callbackUrl} />
        <Typography variant="muted" className="text-xs">
          Prefer password sign in?{" "}
          <Typography
          variant="link"
          as="button"
          type="button"
          onClick={() => {
            persistPreference(true);
          }}
        >
          Use password
        </Typography>
      </Typography>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      <SignInPasswordForm callbackUrl={props.callbackUrl} />
      <Typography variant="muted" className="text-xs">
        Want faster sign in?{" "}
        <Typography
        variant="link"
        as="button"
        type="button"
        onClick={() => {
          persistPreference(false);
        }}
      >
        Login with OTP code
      </Typography>
    </Typography>
    </div>
  );
};
