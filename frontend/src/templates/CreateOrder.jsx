function CreateOrder({ form, onChange, onSubmit, products, services, onCancel }) {
  return (
    <section className="card">
      <h2>Create New Order</h2>
      <p>Fill in the form below to place a new order.</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="phone">Phone Number</label>
        <input id="phone" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} required />

        <label htmlFor="product">Select Product</label>
        <select id="product" value={form.product} onChange={(e) => onChange({ ...form, product: e.target.value })}>
          <option value="">-- Select Product --</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - {product.cost} TZS (Available: {product.quantity})
            </option>
          ))}
        </select>
        <label htmlFor="product-qty">Product Quantity</label>
        <input
          id="product-qty"
          type="number"
          min="1"
          value={form.product_quantity}
          onChange={(e) => onChange({ ...form, product_quantity: e.target.value })}
        />

        <label htmlFor="service">Select Service</label>
        <select id="service" value={form.service} onChange={(e) => onChange({ ...form, service: e.target.value })}>
          <option value="">-- Select Service --</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {service.cost} TZS (Available: {service.quantity})
            </option>
          ))}
        </select>
        <label htmlFor="service-qty">Service Quantity</label>
        <input
          id="service-qty"
          type="number"
          min="1"
          value={form.service_quantity}
          onChange={(e) => onChange({ ...form, service_quantity: e.target.value })}
        />

        <div className="row-actions">
          <button type="submit">Place Order</button>
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

export default CreateOrder;
