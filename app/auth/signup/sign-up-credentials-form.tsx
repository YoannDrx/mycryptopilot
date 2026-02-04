"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LoginCredentialsFormType } from "./signup.schema";
import { LoginCredentialsFormScheme } from "./signup.schema";

export const SignUpCredentialsForm = () => {
  const form = useZodForm({
    schema: LoginCredentialsFormScheme,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      verifyPassword: "",
      image: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: LoginCredentialsFormType) => {
      return unwrapSafePromise(
        authClient.signUp.email({
          email: values.email,
          password: values.password,
          name: values.name,
          image: values.image,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      // Process full-refresh
      const newUrl = window.location.origin + getCallbackUrl("/dashboard");
      window.location.href = newUrl;
    },
  });

  async function onSubmit(values: LoginCredentialsFormType) {
    if (values.password !== values.verifyPassword) {
      form.setError("verifyPassword", {
        message: "Password does not match",
      });
      return;
    }

    return submitMutation.mutateAsync(values);
  }

  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        return onSubmit(values);
      }}
      className="max-w-lg space-y-4"
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[var(--text-secondary)]">Nom</FormLabel>
            <FormControl>
              <Input
                placeholder="John Doe"
                className="border-[var(--glass-border)] bg-[var(--bg-graphite)] focus:border-[#00ffaa]/50 focus:ring-[#00ffaa]/20"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[var(--text-secondary)]">
              Email
            </FormLabel>
            <FormControl>
              <Input
                placeholder="john@doe.com"
                className="border-[var(--glass-border)] bg-[var(--bg-graphite)] focus:border-[#00ffaa]/50 focus:ring-[#00ffaa]/20"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[var(--text-secondary)]">
              Mot de passe
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                className="border-[var(--glass-border)] bg-[var(--bg-graphite)] focus:border-[#00ffaa]/50 focus:ring-[#00ffaa]/20"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="verifyPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[var(--text-secondary)]">
              Confirmer le mot de passe
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                className="border-[var(--glass-border)] bg-[var(--bg-graphite)] focus:border-[#00ffaa]/50 focus:ring-[#00ffaa]/20"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="submit"
        variant="emerald"
        className="w-full"
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending ? "Création..." : "Créer mon compte"}
      </Button>
    </Form>
  );
};
