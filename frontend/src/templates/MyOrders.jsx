function MyOrders({ orders }) {
  const totalForUser = orders.reduce((sum, order) => sum + (Number(order.total_cost) || 0), 0);

  return (
    <section className="card">
      <div className="orders-header">
        <h2>My Orders</h2>
        <p className="orders-total"><strong>Total:</strong> {totalForUser}</p>
      </div>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="order-block">
            <div className="order-top">
              <h4>Order #{order.id}</h4>
              <span className={`status-pill status-${String(order.status || "pending").toLowerCase()}`}>
                {order.status}
              </span>
            </div>
            <div className="order-meta">
              <span><strong>Phone:</strong> {order.phone || "-"}</span>
              <span><strong>Items:</strong> {order.items.length}</span>
            </div>
            <p><strong>Admin Feedback:</strong> {order.admin_feedback || "No feedback yet."}</p>
            <p>
              <strong>Estimated Completion:</strong>{" "}
              {order.estimated_completion_at ? new Date(order.estimated_completion_at).toLocaleString() : "Not set"}
            </p>
            <table>
              <thead>
                <tr><th>Item</th><th>Unit Cost</th><th>Qty</th><th>Total</th></tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product || item.service}</td>
                    <td>{item.unit_price}</td>
                    <td>{item.quantity}</td>
                    <td>{item.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p><strong>Total Cost:</strong> {order.total_cost}</p>
          </div>
        ))
      )}
    </section>
  );
}

export default MyOrders;
