import { useEffect, useState } from "react";
import hotelLogo from "../assets/hotel-logo.svg";

function BaseLayout({ user, currentPage, onNavigate, onLogout, children }) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navClass = (page) => `nav-btn${currentPage === page ? " active" : ""}`;
  const linksClass = `top-nav__links${isNavOpen ? " is-open" : ""}`;

  useEffect(() => {
    setIsNavOpen(false);
  }, [currentPage]);

  const handleNavigate = (page) => {
    onNavigate(page);
    setIsNavOpen(false);
  };

  return (
    <div>
      <nav className="top-nav">
        <div className="top-nav__glow" aria-hidden="true" />
        <div className="top-nav__inner">
          <div className="top-nav__brand">
            <span className="brand-mark">
              <img src={hotelLogo} alt="Hotel System Logo" />
            </span>
            <span>Hotel System</span>
          </div>
          <button
            type="button"
            className={`nav-toggle${isNavOpen ? " is-open" : ""}`}
            aria-label="Toggle navigation menu"
            aria-expanded={isNavOpen}
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className={linksClass}>
            <button className={navClass("home")} onClick={() => handleNavigate("home")}>Home</button>
            {user ? (
              <>
                <button className={navClass("products")} onClick={() => handleNavigate("products")}>Products</button>
                <button className={navClass("services")} onClick={() => handleNavigate("services")}>Services</button>
                <button className={navClass("my_orders")} onClick={() => handleNavigate("my_orders")}>My Orders</button>
                <button className={navClass("create_order")} onClick={() => handleNavigate("create_order")}>Create Order</button>
                {user.is_admin && (
                  <button className={navClass("admin_dashboard")} onClick={() => handleNavigate("admin_dashboard")}>Admin</button>
                )}
                <button className="nav-btn nav-btn-logout" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className={navClass("login")} onClick={() => handleNavigate("login")}>Login</button>
                <button className={navClass("register")} onClick={() => handleNavigate("register")}>Register</button>
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
