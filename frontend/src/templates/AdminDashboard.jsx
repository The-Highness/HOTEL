import { useMemo, useState } from "react";

const ORDER_STATUSES = ["Pending", "Accepted", "Rejected", "Completed"];

function formatDateTimeLocal(isoValue) {
  if (!isoValue) return "";
  const value = new Date(isoValue);
  if (Number.isNaN(value.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function AdminDashboard({
  orders,
  products,
  services,
  onUpdateOrder,
  onCreateItem,
  onToggleItem,
  onUpdateItem,
  onDeleteOrder,
  onDeleteUser
}) {
  const [orderEdits, setOrderEdits] = useState({});
  const [newProduct, setNewProduct] = useState({ name: "", price: "", quantity: "" });
  const [newService, setNewService] = useState({ name: "", price: "", quantity: "" });
  const [catalogEdits, setCatalogEdits] = useState({});

  const activeProducts = useMemo(() => products.filter((item) => item.is_active).length, [products]);
  const activeServices = useMemo(() => services.filter((item) => item.is_active).length, [services]);

  const getOrderDraft = (order) =>
    orderEdits[order.id] || {
      status: order.status,
      admin_feedback: order.admin_feedback || "",
      estimated_completion_at: formatDateTimeLocal(order.estimated_completion_at)
    };

  const handleOrderDraftChange = (order, changes) => {
    setOrderEdits((prev) => ({
      ...prev,
      [order.id]: {
        ...getOrderDraft(order),
        ...changes
      }
    }));
  };

  const submitOrderUpdate = (order) => {
    const draft = getOrderDraft(order);
    onUpdateOrder(order.id, draft);
  };

  const submitCreateProduct = (event) => {
    event.preventDefault();
    onCreateItem("product", newProduct);
    setNewProduct({ name: "", price: "", quantity: "" });
  };

  const submitCreateService = (event) => {
    event.preventDefault();
    onCreateItem("service", newService);
    setNewService({ name: "", price: "", quantity: "" });
  };

  const getCatalogKey = (type, id) => `${type}-${id}`;

  const getCatalogDraft = (type, item) =>
    catalogEdits[getCatalogKey(type, item.id)] || {
      name: item.name,
      price: String(item.cost ?? item.price),
      quantity: String(item.quantity)
    };

  const handleCatalogDraftChange = (type, item, changes) => {
    const key = getCatalogKey(type, item.id);
    setCatalogEdits((prev) => ({
      ...prev,
      [key]: {
        ...getCatalogDraft(type, item),
        ...changes
      }
    }));
  };

  const submitCatalogUpdate = (type, item) => {
    onUpdateItem(type, item.id, getCatalogDraft(type, item));
  };

  const confirmDeleteOrder = (order) => {
    if (!onDeleteOrder) return;
    const ok = window.confirm(`Delete order #${order.id}? This cannot be undone.`);
    if (ok) {
      onDeleteOrder(order.id);
    }
  };

  const confirmDeleteUser = (order) => {
    if (!onDeleteUser) return;
    const label = order.hotel_name || order.username || `User ${order.user_id}`;
    const ok = window.confirm(`Delete user "${label}" and all their data? This cannot be undone.`);
    if (ok) {
      onDeleteUser(order.user_id);
    }
  };

  return (
    <section>
      <header className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage orders and catalog without breaking customer history.</p>
      </header>

      <div className="grid-3">
        <article className="card"><h4>Total Orders</h4><p className="stat">{orders.length}</p></article>
        <article className="card"><h4>Active Products</h4><p className="stat">{activeProducts}</p></article>
        <article className="card"><h4>Active Services</h4><p className="stat">{activeServices}</p></article>
      </div>

      <section className="card">
        <h3>Order Control</h3>
        <table>
          <thead>
            <tr>
              <th>#Order</th>
              <th>User</th>
              <th>Hotel Name</th>
              <th>Hotel ID</th>
              <th>Location</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Completion Time</th>
              <th>Feedback</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="11">No orders found.</td></tr>
            ) : (
              orders.map((order) => {
                const draft = getOrderDraft(order);
                return (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.username}</td>
                    <td>{order.hotel_name || "-"}</td>
                    <td>{order.hotel_id || "-"}</td>
                    <td>{order.contact_location || "-"}</td>
                    <td>{order.phone || "-"}</td>
                    <td>
                      <select
                        value={draft.status}
                        onChange={(e) => handleOrderDraftChange(order, { status: e.target.value })}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        value={draft.estimated_completion_at}
                        onChange={(e) =>
                          handleOrderDraftChange(order, { estimated_completion_at: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={draft.admin_feedback}
                        onChange={(e) => handleOrderDraftChange(order, { admin_feedback: e.target.value })}
                        placeholder="e.g. Ready in 2 hours"
                      />
                    </td>
                    <td>{order.total_cost}</td>
                    <td>
                      <button type="button" onClick={() => submitOrderUpdate(order)}>Save</button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => confirmDeleteOrder(order)}
                      >
                        Delete Order
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => confirmDeleteUser(order)}
                      >
                        Delete User
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Add Product</h3>
        <form onSubmit={submitCreateProduct}>
          <label htmlFor="product-name">Product Name</label>
          <input
            id="product-name"
            value={newProduct.name}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <label htmlFor="product-price">Price</label>
          <input
            id="product-price"
            type="number"
            min="1"
            step="0.01"
            value={newProduct.price}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
          <label htmlFor="product-quantity">Quantity</label>
          <input
            id="product-quantity"
            type="number"
            min="0"
            value={newProduct.quantity}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, quantity: e.target.value }))}
            required
          />
          <button type="submit">Add Product</button>
        </form>
      </section>

      <section className="card">
        <h3>Add Service</h3>
        <form onSubmit={submitCreateService}>
          <label htmlFor="service-name">Service Name</label>
          <input
            id="service-name"
            value={newService.name}
            onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <label htmlFor="service-price">Price</label>
          <input
            id="service-price"
            type="number"
            min="1"
            step="0.01"
            value={newService.price}
            onChange={(e) => setNewService((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
          <label htmlFor="service-quantity">Quantity</label>
          <input
            id="service-quantity"
            type="number"
            min="0"
            value={newService.quantity}
            onChange={(e) => setNewService((prev) => ({ ...prev, quantity: e.target.value }))}
            required
          />
          <button type="submit">Add Service</button>
        </form>
      </section>

      <section className="card">
        <h3>Catalog Status</h3>
        <div className="grid-3">
          <article>
            <h4>Products</h4>
            <table>
              <thead>
                <tr><th>Name</th><th>Cost</th><th>Qty</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={`product-${item.id}`}>
                    <td>
                      <input
                        value={getCatalogDraft("product", item).name}
                        onChange={(e) => handleCatalogDraftChange("product", item, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={getCatalogDraft("product", item).price}
                        onChange={(e) => handleCatalogDraftChange("product", item, { price: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={getCatalogDraft("product", item).quantity}
                        onChange={(e) => handleCatalogDraftChange("product", item, { quantity: e.target.value })}
                      />
                    </td>
                    <td>{item.is_active ? "Active" : "Inactive"}</td>
                    <td>
                      <button type="button" onClick={() => submitCatalogUpdate("product", item)}>Save</button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => onToggleItem("product", item.id, !item.is_active)}
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <article>
            <h4>Services</h4>
            <table>
              <thead>
                <tr><th>Name</th><th>Cost</th><th>Qty</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {services.map((item) => (
                  <tr key={`service-${item.id}`}>
                    <td>
                      <input
                        value={getCatalogDraft("service", item).name}
                        onChange={(e) => handleCatalogDraftChange("service", item, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={getCatalogDraft("service", item).price}
                        onChange={(e) => handleCatalogDraftChange("service", item, { price: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={getCatalogDraft("service", item).quantity}
                        onChange={(e) => handleCatalogDraftChange("service", item, { quantity: e.target.value })}
                      />
                    </td>
                    <td>{item.is_active ? "Active" : "Inactive"}</td>
                    <td>
                      <button type="button" onClick={() => submitCatalogUpdate("service", item)}>Save</button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => onToggleItem("service", item.id, !item.is_active)}
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      </section>
    </section>
  );
}

export default AdminDashboard;
