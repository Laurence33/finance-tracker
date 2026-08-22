import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
            userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID!,
            // The pool's `UsernameAttributes` is `email` (see backend/template.yaml), so
            // the email *is* the username. Without this the Authenticator falls back to
            // its 'username' login mechanism and labels the field "Username" — and
            // Cognito then rejects any sign-up whose username is not an email address.
            loginWith: {
                email: true,
            },
        },
    },
});
