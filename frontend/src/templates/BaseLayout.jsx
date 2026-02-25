function BaseLayout({ user, currentPage, onNavigate, onLogout, children }) {
  return (
    <div>
      <nav className="top-nav">
        <button onClick={() => onNavigate("home")}>Home</button>
        {user ? (
          <>
            <button onClick={() => onNavigate("products")}>Products</button>
            <button onClick={() => onNavigate("services")}>Services</button>
            <button onClick={() => onNavigate("my_orders")}>My Orders</button>
            <button onClick={() => onNavigate("create_order")}>Create Order</button>
            {user.is_admin && <button onClick={() => onNavigate("admin_dashboard")}>Admin</button>}
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => onNavigate("login")}>Login</button>
            <button onClick={() => onNavigate("register")}>Register</button>
          </>
        )}
      </nav>
      <main className="page-wrap" data-page={currentPage}>
        {children}
      </main>
    </div>
  );
}

export default BaseLayout;
