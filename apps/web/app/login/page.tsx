import { LoginForm } from "./login-form";
import styles from "../styles/login.module.scss";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1>Sign in</h1>
        <p>
          Enter your email to receive a secure magic link. Access is limited to
          Luxury Heritage staff and artisans.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
