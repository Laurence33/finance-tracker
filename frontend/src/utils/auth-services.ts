import {
    confirmResetPassword,
    confirmSignUp,
    resendSignUpCode,
    resetPassword,
    signIn,
    signUp,
    type ConfirmResetPasswordInput,
    type ConfirmSignUpInput,
    type ResendSignUpCodeInput,
    type ResetPasswordInput,
    type SignInInput,
    type SignUpInput,
} from 'aws-amplify/auth';

/**
 * The email address *is* the username — the pool sets `UsernameAttributes:
 * [email]` (see `backend/template.yaml`) — and it was created without a
 * `UsernameConfiguration`, so Cognito compares usernames case-sensitively.
 * Left alone, `Foo@example.com` and `foo@example.com` are two separate
 * accounts: sign up as one, fail to sign in as the other.
 *
 * `UsernameConfiguration` is immutable once a pool exists, so the client
 * normalises instead. Every Authenticator service that carries a username
 * lowercases it, which keeps sign-up, confirmation, sign-in and password reset
 * all pointing at one identity however the address was typed.
 *
 * Normalising here rather than in the input leaves the field showing exactly
 * what the user typed.
 */
const normalise = (username: string) => username.toLowerCase();

/**
 * Passed to `<Authenticator services={…}>`. Only the username-bearing calls are
 * overridden; everything else falls through to Amplify's defaults.
 */
export const authServices = {
    handleSignIn: ({ username, ...input }: SignInInput) =>
        signIn({ ...input, username: normalise(username) }),

    // The email attribute is submitted alongside the username and has to agree
    // with it — Cognito delivers the verification code to the attribute.
    handleSignUp: ({ username, options, ...input }: SignUpInput) =>
        signUp({
            ...input,
            username: normalise(username),
            options: {
                ...options,
                userAttributes: {
                    ...options?.userAttributes,
                    ...(options?.userAttributes?.email && {
                        email: normalise(options.userAttributes.email),
                    }),
                },
            },
        }),

    handleConfirmSignUp: ({ username, ...input }: ConfirmSignUpInput) =>
        confirmSignUp({ ...input, username: normalise(username) }),

    handleResendSignUpCode: ({ username, ...input }: ResendSignUpCodeInput) =>
        resendSignUpCode({ ...input, username: normalise(username) }),

    handleForgotPassword: ({ username, ...input }: ResetPasswordInput) =>
        resetPassword({ ...input, username: normalise(username) }),

    handleForgotPasswordSubmit: ({ username, ...input }: ConfirmResetPasswordInput) =>
        confirmResetPassword({ ...input, username: normalise(username) }),
};
