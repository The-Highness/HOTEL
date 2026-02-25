import { useEffect, useState } from "react";
import BaseLayout from "./templates/BaseLayout";
import Home from "./templates/Home";
import Login from "./templates/Login";
import Register from "./templates/Register";
import Products from "./templates/Products";
import Services from "./templates/Services";
import MyOrders from "./templates/MyOrders";
import CreateOrder from "./templates/CreateOrder";
import AdminDashboard from "./templates/AdminDashboard";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://hotel-backend-bpjr.onrender.com"
).replace(/\/$/, "");
const API_FALLBACK_BASE = import.meta.env.DEV ? "http://127.0.0.1:8000" : "";

const initialRegister = {
  hotel_name: "",
  contact_location: "",
  hotel_id: "",
  password: "",
  confirm_password: ""
};

const initialLogin = {
  identifier: "",
  password: ""
};

const initialOrder = {
  phone: "",
  product: "",
  service: "",
  product_quantity: "1",
  service_quantity: "1"
};

function App() {
  const [page, setPage] = useState("home");
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [orderForm, setOrderForm] = useState(initialOrder);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiRequest = async (path, method = "GET", payload = null) => {
    const options = {
      method,
      credentials: "include",
      headers: {}
    };

    if (payload !== null) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    }

    const parseResponse = async (response) => {
      const rawText = await response.text();
      let data = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          if (!response.ok) {
            throw new Error(`Backend error (${response.status}).`);
          }
        }
      }

      if (!response.ok) {
        throw new Error(data.detail || "Request failed.");
      }

      return data;
    };

    const tryFetch = async (url) => {
      try {
        return await fetch(url, options);
      } catch {
        return null;
      }
    };

    let response = await tryFetch(`${API_BASE}${path}`);
    if (!response && API_FALLBACK_BASE) {
      response = await tryFetch(`${API_FALLBACK_BASE}${path}`);
    }

    if (!response) {
      throw new Error("Imeshindikana ku-connect na backend. Angalia VITE_API_BASE_URL au status ya Render service.");
    }

    return await parseResponse(response);
  };

  const loadData = async (sessionUser) => {
    if (!sessionUser) {
      setProducts([]);
      setServices([]);
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      if (sessionUser.is_admin) {
        const dashboard = await apiRequest("/api/admin-dashboard/");
        setProducts(dashboard.products || []);
        setServices(dashboard.services || []);
        setOrders(dashboard.orders || []);
      } else {
        const [productData, serviceData, orderData] = await Promise.all([
          apiRequest("/api/products/"),
          apiRequest("/api/services/"),
          apiRequest("/api/my-orders/")
        ]);
        setProducts(productData.products || []);
        setServices(serviceData.services || []);
        setOrders(orderData.orders || []);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await apiRequest("/api/me/");
        setUser(data.user);
        await loadData(data.user);
      } catch {
        setUser(null);
      }
    };

    bootstrap();
  }, []);

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const data = await apiRequest("/api/register/", "POST", registerForm);
      setUser(data.user);
      setMessage(data.detail);
      setRegisterForm(initialRegister);
      await loadData(data.user);
      setPage("home");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const data = await apiRequest("/api/login/", "POST", loginForm);
      setUser(data.user);
      setMessage(data.detail);
      setLoginForm(initialLogin);
      await loadData(data.user);
      setPage("home");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogout = async () => {
    setMessage("");
    try {
      await apiRequest("/api/logout/", "POST", {});
      setUser(null);
      setProducts([]);
      setServices([]);
      setOrders([]);
      setMessage("Logout successful.");
      setPage("login");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    if (!user) {
      setMessage("Please login first.");
      setPage("login");
      return;
    }

    setMessage("");
    try {
      const data = await apiRequest("/api/create-order/", "POST", {
        phone: orderForm.phone,
        product: orderForm.product ? Number(orderForm.product) : null,
        service: orderForm.service ? Number(orderForm.service) : null,
        product_quantity: Number(orderForm.product_quantity),
        service_quantity: Number(orderForm.service_quantity)
      });
      setMessage(data.detail || "Order created.");
      setOrderForm(initialOrder);
      await loadData(user);
      setPage("my_orders");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAdminOrderUpdate = async (orderId, payload) => {
    if (!user?.is_admin) {
      setMessage("Admin access required.");
      return;
    }

    setMessage("");
    try {
      const data = await apiRequest(`/api/admin/orders/${orderId}/update/`, "POST", payload);
      setMessage(data.detail || "Order updated.");
      await loadData(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAdminCreateCatalogItem = async (type, payload) => {
    if (!user?.is_admin) {
      setMessage("Admin access required.");
      return;
    }

    const path = type === "product" ? "/api/admin/products/create/" : "/api/admin/services/create/";
    setMessage("");
    try {
      const data = await apiRequest(path, "POST", payload);
      setMessage(data.detail || "Item created.");
      await loadData(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAdminToggleCatalogItem = async (type, id, isActive) => {
    if (!user?.is_admin) {
      setMessage("Admin access required.");
      return;
    }

    const path =
      type === "product"
        ? `/api/admin/products/${id}/toggle-active/`
        : `/api/admin/services/${id}/toggle-active/`;
    setMessage("");
    try {
      const data = await apiRequest(path, "POST", { is_active: isActive });
      setMessage(data.detail || "Item updated.");
      await loadData(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAdminUpdateCatalogItem = async (type, id, payload) => {
    if (!user?.is_admin) {
      setMessage("Admin access required.");
      return;
    }

    const path =
      type === "product"
        ? `/api/admin/products/${id}/update/`
        : `/api/admin/services/${id}/update/`;
    setMessage("");
    try {
      const data = await apiRequest(path, "POST", payload);
      setMessage(data.detail || "Item updated.");
      await loadData(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAdminDeleteOrder = async (orderId) => {
    if (!user?.is_admin) {
      setMessage("Admin access required.");
      return;
    }

    setMessage("");
    try {
      const data = await apiRequest(`/api/admin/orders/${orderId}/delete/`, "POST", {});
      setMessage(data.detail || "Order deleted.");
      await loadData(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAdminDeleteUser = async (userId) => {
    if (!user?.is_admin) {
      setMessage("Admin access required.");
      return;
    }

    setMessage("");
    try {
      const data = await apiRequest(`/api/admin/users/${userId}/delete/`, "POST", {});
      setMessage(data.detail || "User deleted.");
      await loadData(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleNavigate = (targetPage) => {
    const protectedPages = ["products", "services", "my_orders", "create_order", "admin_dashboard"];
    if (!user && protectedPages.includes(targetPage)) {
      setMessage("Please login first.");
      setPage("login");
      return;
    }

    if (targetPage === "admin_dashboard" && !user?.is_admin) {
      setMessage("Admin access required.");
      return;
    }

    setPage(targetPage);
  };

  const renderPage = () => {
    if (loading) {
      return <section className="card"><p>Loading...</p></section>;
    }

    if (page === "login") {
      return (
        <Login
          form={loginForm}
          onChange={setLoginForm}
          onSubmit={handleLogin}
          onSwitch={() => setPage("register")}
        />
      );
    }

    if (page === "register") {
      return (
        <Register
          form={registerForm}
          onChange={setRegisterForm}
          onSubmit={handleRegister}
          onSwitch={() => setPage("login")}
        />
      );
    }

    if (page === "products") {
      return <Products products={products} />;
    }

    if (page === "services") {
      return <Services services={services} />;
    }

    if (page === "my_orders") {
      return <MyOrders orders={orders} />;
    }

    if (page === "create_order") {
      return (
        <CreateOrder
          form={orderForm}
          onChange={setOrderForm}
          onSubmit={handleCreateOrder}
          products={products}
          services={services}
          onCancel={() => setPage("my_orders")}
        />
      );
    }

    if (page === "admin_dashboard" && user?.is_admin) {
      return (
        <AdminDashboard
          orders={orders}
          products={products}
          services={services}
          onUpdateOrder={handleAdminOrderUpdate}
          onCreateItem={handleAdminCreateCatalogItem}
          onToggleItem={handleAdminToggleCatalogItem}
          onUpdateItem={handleAdminUpdateCatalogItem}
          onDeleteOrder={handleAdminDeleteOrder}
          onDeleteUser={handleAdminDeleteUser}
        />
      );
    }

    return <Home user={user} onNavigate={handleNavigate} />;
  };

  return (
    <div className="app">
      <BaseLayout user={user} currentPage={page} onNavigate={handleNavigate} onLogout={handleLogout}>
        {message && <p className="message">{message}</p>}
        {renderPage()}
      </BaseLayout>
    </div>
  );
}

export default App;

