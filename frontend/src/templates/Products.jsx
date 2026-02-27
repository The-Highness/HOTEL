function Products({ products }) {
  return (
    <section className="card catalog-page products-page">
      <h2>Products 🛍️</h2>
      <p className="catalog-subtitle">Stock ya bidhaa za hotel kwa muonekano wa kisasa.</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Cost</th><th>Quantity</th></tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td><span className="item-emoji" aria-hidden="true">🧴</span>{product.name}</td>
              <td>{product.cost ?? product.price}</td>
              <td>{product.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Products;
