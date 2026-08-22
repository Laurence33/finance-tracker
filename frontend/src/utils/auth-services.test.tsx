import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

const calls: Record<string, { username: string; options?: { userAttributes?: { email?: string } } }> = {};

vi.mock('aws-amplify/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('aws-amplify/auth')>();
  const spy = (name: string, result: any) => (input: any) => {
    calls[name] = input;
    return Promise.resolve(result);
  };
  return {
    ...actual,
    signIn: spy('signIn', { isSignedIn: false, nextStep: { signInStep: 'CONFIRM_SIGN_UP' } }),
    signUp: spy('signUp', { isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } }),
    confirmSignUp: spy('confirmSignUp', { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } }),
    resendSignUpCode: spy('resendSignUpCode', {}),
    resetPassword: spy('resetPassword', {
      isPasswordReset: false,
      nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' },
    }),
    confirmResetPassword: spy('confirmResetPassword', undefined),
    getCurrentUser: () => Promise.reject(new Error('no user')),
  };
});

const MIXED = 'Person@Example.COM';

async function mount() {
  const { Authenticator } = await import('@aws-amplify/ui-react');
  const { authServices } = await import('@/utils/auth-services');
  return render(
    <Authenticator services={authServices}>{() => <div>in</div>}</Authenticator>,
  );
}

describe('email is lowercased at the service boundary', () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = 'us-east-1_test12345';
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID = 'testclientid1234567890';
    await import('@/utils/amplify-config');
  });

  beforeEach(() => {
    for (const key of Object.keys(calls)) delete calls[key];
  });

  it('lowercases the username on sign in', async () => {
    const { unmount } = await mount();
    await waitFor(() => expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: MIXED } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Passw0rdd' } });
    // The field is not mutated — it still shows what was typed.
    expect(screen.getByLabelText(/^email$/i)).toHaveValue(MIXED);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(calls.signIn).toBeDefined());
    expect(calls.signIn.username).toBe('person@example.com');
    unmount();
  });

  it('lowercases username and the email attribute on sign up, and the confirmation code call', async () => {
    const { unmount } = await mount();
    await waitFor(() => expect(screen.getByRole('tab', { name: /create account/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('tab', { name: /create account/i }));
    await waitFor(() => expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: MIXED } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Passw0rdd' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Passw0rdd' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => expect(calls.signUp).toBeDefined());
    expect(calls.signUp.username).toBe('person@example.com');
    expect(calls.signUp.options?.userAttributes?.email).toBe('person@example.com');

    // The machine now holds the *typed* username; the confirm step must still
    // reach the lowercased identity.
    await waitFor(() => expect(screen.getByLabelText(/confirmation code|code/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /resend code/i }));
    await waitFor(() => expect(calls.resendSignUpCode).toBeDefined());
    expect(calls.resendSignUpCode.username).toBe('person@example.com');

    fireEvent.change(screen.getByLabelText(/confirmation code|code/i), { target: { value: '123456' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(calls.confirmSignUp).toBeDefined());
    expect(calls.confirmSignUp.username).toBe('person@example.com');
    unmount();
  });

  it('lowercases the username on forgot password', async () => {
    const { unmount } = await mount();
    await waitFor(() => expect(screen.getByRole('button', { name: /forgot your password/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /forgot your password/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /send code/i })).toBeInTheDocument());
    fireEvent.change(document.querySelector('input[name="username"]')!, { target: { value: MIXED } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(calls.resetPassword).toBeDefined());
    expect(calls.resetPassword.username).toBe('person@example.com');

    await waitFor(() => expect(screen.getByLabelText(/new password/i)).toBeInTheDocument());
    fireEvent.change(document.querySelector('input[name="confirmation_code"]')!, { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'Passw0rdd' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Passw0rdd' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(calls.confirmResetPassword).toBeDefined());
    expect(calls.confirmResetPassword.username).toBe('person@example.com');
    unmount();
  });
});
