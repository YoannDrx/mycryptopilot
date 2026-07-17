import { authClient } from "@/lib/auth-client";
import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpCredentialsForm } from "../app/auth/signup/sign-up-credentials-form";
import { setup } from "../test/setup";

describe("SignUpCredentialsForm", () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/auth/signup",
      },
      writable: true,
    });

    // Mock successful signup response
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    // Reset searchParams to default (empty)
    vi.mocked(useSearchParams).mockReturnValue(createTestSearchParams());
  });

  it("should render all form fields", async () => {
    setup(<SignUpCredentialsForm />);

    // Check all fields are rendered (French labels)
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/confirmer le mot de passe/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /créer mon compte/i }),
    ).toBeInTheDocument();
  });

  it("should show error when passwords don't match", async () => {
    const { user } = setup(<SignUpCredentialsForm />);

    // Fill the form with mismatched passwords (French labels)
    await user.type(screen.getByLabelText(/nom/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "password456",
    );

    // Submit the form
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/password does not match/i)).toBeInTheDocument();
    });

    // Should not call signup API
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("should submit form and redirect on successful signup", async () => {
    const { user } = setup(<SignUpCredentialsForm />);

    // Fill all fields correctly (French labels)
    await user.type(screen.getByLabelText(/nom/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "password123",
    );

    // Submit the form
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        name: "John Doe",
        image: "",
      });
    });

    // The read-only product starts on its core simulation surface.
    expect(window.location.href).toBe("http://localhost:3000/risk-console");
  });

  it("should use custom callback URL from searchParams", async () => {
    // Mock searchParams with custom callback
    vi.mocked(useSearchParams).mockReturnValue(
      createTestSearchParams({ callbackUrl: "/dashboard" }),
    );

    const { user } = setup(<SignUpCredentialsForm />);

    // Fill all fields correctly (French labels)
    await user.type(screen.getByLabelText(/nom/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "password123",
    );

    // Submit the form
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));

    // Wait for submission to complete
    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalled();
    });

    expect(window.location.href).toBe("http://localhost:3000/risk-console");
  });
});
