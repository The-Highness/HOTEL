function Login({ form, onChange, onSubmit, onSwitch }) {
  return (
    <section className="card auth-card">
      <h2>Welcome Back</h2>
      <p>Login with Hotel ID. Admin can login with username.</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="login-identifier">Hotel ID or Username</label>
        <input id="login-identifier" value={form.identifier} onChange={(e) => onChange({ ...form, identifier: e.target.value })} required />

        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" value={form.password} onChange={(e) => onChange({ ...form, password: e.target.value })} required />

        <button type="submit">Login</button>
      </form>
      <p>
        Do not have an account? <button className="link-btn" onClick={onSwitch}>Register here</button>
      </p>
    </section>
  );
}

export default Login;
