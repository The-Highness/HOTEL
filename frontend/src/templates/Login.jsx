function Login({ form, onChange, onSubmit, onSwitch, loading = false }) {
  return (
    <section className="card auth-card">
      <h2>Welcome Back</h2>
      <p>Sign in with your Hotel ID. Admin can sign in with username.</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="login-identifier">Hotel ID or Username</label>
        <input
          id="login-identifier"
          value={form.identifier}
          onChange={(e) => onChange({ ...form, identifier: e.target.value })}
          disabled={loading}
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={form.password}
          onChange={(e) => onChange({ ...form, password: e.target.value })}
          disabled={loading}
          required
        />

        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
      </form>
      <p>
        Don&apos;t have an account? <button className="link-btn" onClick={onSwitch} disabled={loading}>Register here</button>
      </p>
    </section>
  );
}

export default Login;
