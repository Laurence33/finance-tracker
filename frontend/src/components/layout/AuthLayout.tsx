import Money from '@/components/atoms/Money';
import type { MoneyAmount } from '@/utils/money';

/**
 * The signed-out front door — sign in, create account, forgot password, and the
 * confirmation-code screens those flows lead to.
 *
 * These are not pages. They are routes of the Amplify `<Authenticator>`, so the
 * only way to shape them is through the slots it exposes. This module supplies
 * two of them:
 *
 * - the top-level `Header` / `Footer`, which `RouteContainer` renders as
 *   siblings of `[data-amplify-router]` inside `[data-amplify-container]`. That
 *   is what lets `auth.css` lay the ink panel and the form out as two grid
 *   areas **without** wrapping `<Authenticator>` in a shell element — a wrapper
 *   would also have to wrap the authenticated app, since the Authenticator
 *   returns bare `children` once a session exists.
 * - a per-route `Header` for forgot-password, which otherwise renders an
 *   unadorned heading with nothing to explain what the code is for.
 *
 * Everything visual lives in `src/styles/auth.css`. Deliberately: `initialState`
 * accepts only the three entry routes, so `confirmSignUp` and
 * `confirmResetPassword` can be reached only by completing a flow, and a design
 * carried by per-route slots would leave those two screens looking stock.
 */

/**
 * A miniature of the app's own ledger list, used as the ink panel's specimen.
 * The figures go through `<Money>` like every other figure in the app — a
 * specimen that broke §3 of `docs/ui-patterns.md` would be teaching the wrong
 * thing on the first screen anyone sees. Decorative, so the whole block is
 * hidden from assistive tech.
 */
const SPECIMEN: { name: string; amount: MoneyAmount }[] = [
  { name: 'Boarding', amount: 1500 },
  { name: 'Electricity', amount: { min: 2000, max: 6000 } },
  { name: 'Claude Code Max', amount: 1200 },
];

/**
 * The ink panel. Rendered above the form below 60rem and beside it above.
 */
function AuthBrand() {
  return (
    <div className="auth-brand">
      <div className="auth-brand__glow" aria-hidden="true" />
      <div className="auth-brand__grain" aria-hidden="true" />

      <div className="auth-brand__wordmark">
        <span className="auth-brand__mark" aria-hidden="true" />
        Finance Tracker
      </div>

      <div>
        <h1 className="auth-brand__headline">
          Every peso,
          <br />
          <em>accounted for.</em>
        </h1>
        <p className="auth-brand__sub">
          Expenses, lendings and recurring bills in one ledger you actually keep.
        </p>
      </div>

      <div aria-hidden="true">
        <div className="auth-brand__ledger">
          {SPECIMEN.map((row) => (
            <div className="auth-brand__row" key={row.name}>
              <span>{row.name}</span>
              <Money component="span" amount={row.amount} surface="inherit" />
            </div>
          ))}
        </div>
        <p className="auth-brand__caption">Illustrative figures</p>
      </div>
    </div>
  );
}

/** The quiet strip under the form. */
function AuthLegal() {
  return (
    <div className="auth-legal">
      Your ledger is private to your account. Nothing is shared.
    </div>
  );
}

function ForgotPasswordHeader() {
  return (
    <>
      <h3 className="amplify-heading">Reset your password</h3>
      <p className="auth-route-note">
        Enter the email you signed up with and we&rsquo;ll send a six-digit code
        to reset your password.
      </p>
    </>
  );
}

function SignInHeader() {
  return <p className="auth-route-note">Welcome back. Pick up where you left off.</p>;
}

function SignUpHeader() {
  return (
    <p className="auth-route-note">
      One account, one ledger. Your email is your sign-in.
    </p>
  );
}

/**
 * Passed to `<Authenticator components={…}>`. Only the slots this design
 * actually replaces appear here; every other route keeps Amplify's own
 * structure and picks up the styling from `auth.css`.
 */
export const authComponents = {
  Header: AuthBrand,
  Footer: AuthLegal,
  SignIn: { Header: SignInHeader },
  SignUp: { Header: SignUpHeader },
  ForgotPassword: { Header: ForgotPasswordHeader },
};

/**
 * Placeholders. The labels stay Amplify's — `auth.css` sets them in the app's
 * uppercase micro-label style — but the stock placeholders restate the label
 * ("Enter your Password" under PASSWORD), which is noise once the label is
 * permanently visible. These say the one thing the label cannot: the shape of
 * the value expected.
 *
 * The two confirmation routes are here rather than in `authComponents` for the
 * reason given at the top of this file — they are reachable only by completing
 * a flow, so they need to be dressed without a per-route slot.
 */
export const authFormFields = {
  signIn: {
    username: { placeholder: 'you@example.com' },
    password: { placeholder: 'Your password' },
  },
  signUp: {
    email: { placeholder: 'you@example.com' },
    password: { placeholder: 'At least 8 characters' },
    confirm_password: { placeholder: 'Repeat it' },
  },
  forgotPassword: { username: { placeholder: 'you@example.com' } },
  confirmSignUp: { confirmation_code: { placeholder: '6-digit code' } },
  confirmResetPassword: {
    confirmation_code: { placeholder: '6-digit code' },
    password: { placeholder: 'At least 8 characters' },
    confirm_password: { placeholder: 'Repeat it' },
  },
};
