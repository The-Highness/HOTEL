function BaseLayout({ user, currentPage, onNavigate, onLogout, children }) {
  const navClass = (page) => `nav-btn${currentPage === page ? " active" : ""}`;

  return (
    <div>
      <nav className="top-nav">
        <div className="top-nav__inner">
          <div className="top-nav__brand">
            <span className="brand-mark">HS</span>
            <span>Hotel System</span>
          </div>
          <div className="top-nav__links">
            <button className={navClass("home")} onClick={() => onNavigate("home")}>Home</button>
            {user ? (
              <>
                <button className={navClass("products")} onClick={() => onNavigate("products")}>Products</button>
                <button className={navClass("services")} onClick={() => onNavigate("services")}>Services</button>
                <button className={navClass("my_orders")} onClick={() => onNavigate("my_orders")}>My Orders</button>
                <button className={navClass("create_order")} onClick={() => onNavigate("create_order")}>Create Order</button>
                {user.is_admin && (
                  <button className={navClass("admin_dashboard")} onClick={() => onNavigate("admin_dashboard")}>Admin</button>
                )}
                <button className="nav-btn nav-btn-logout" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className={navClass("login")} onClick={() => onNavigate("login")}>Login</button>
                <button className={navClass("register")} onClick={() => onNavigate("register")}>Register</button>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="page-wrap" data-page={currentPage}>
        {children}
      </main>
    </div>
  );
}

export default BaseLayout;
