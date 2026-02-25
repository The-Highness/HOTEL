function Home({ user, onNavigate }) {
  return (
    <>
      <section className="hero">
        <h1>Hotel Product & Service Management System</h1>
        <p>Manage hotel products, services, and customer orders in one place.</p>
        {user ? (
          <div className="hero-actions">
            <button onClick={() => onNavigate("create_order")}>Create Order</button>
            <button className="secondary" onClick={() => onNavigate("my_orders")}>My Orders</button>
          </div>
        ) : (
          <div className="hero-actions">
            <button onClick={() => onNavigate("login")}>Login</button>
            <button className="secondary" onClick={() => onNavigate("register")}>Register</button>
          </div>
        )}
      </section>

      <section className="grid-3">
        <article className="card"><h3>Products</h3><p>View and manage hotel products.</p></article>
        <article className="card"><h3>Services</h3><p>Offer services like room service and laundry.</p></article>
        <article className="card"><h3>Orders</h3><p>Create and track customer orders.</p></article>
      </section>
    </>
  );
}

export default Home;
