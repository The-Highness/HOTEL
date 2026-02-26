function Register({ form, onChange, onSubmit, onSwitch, loading = false }) {
  return (
    <section className="card auth-card">
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="register-hotel-name">Hotel Name</label>
        <input
          id="register-hotel-name"
          value={form.hotel_name}
          onChange={(e) => onChange({ ...form, hotel_name: e.target.value })}
          disabled={loading}
          required
        />

        <label htmlFor="register-contact-location">Contact Location</label>
        <input
          id="register-contact-location"
          value={form.contact_location}
          onChange={(e) => onChange({ ...form, contact_location: e.target.value })}
          disabled={loading}
          required
        />

        <label htmlFor="register-hotel-id">Hotel ID</label>
        <input
          id="register-hotel-id"
          value={form.hotel_id}
          onChange={(e) => onChange({ ...form, hotel_id: e.target.value })}
          disabled={loading}
          required
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={form.password}
          onChange={(e) => onChange({ ...form, password: e.target.value })}
          disabled={loading}
          required
        />

        <label htmlFor="register-confirm">Confirm Password</label>
        <input
          id="register-confirm"
          type="password"
          value={form.confirm_password}
          onChange={(e) => onChange({ ...form, confirm_password: e.target.value })}
          disabled={loading}
          required
        />

        <button type="submit" disabled={loading}>{loading ? "Inatuma..." : "Register"}</button>
      </form>
      <p>
        Already have account? <button className="link-btn" onClick={onSwitch} disabled={loading}>Login</button>
      </p>
    </section>
  );
}

export default Register;
