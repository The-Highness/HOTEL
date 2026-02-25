function Products({ products }) {
  return (
    <section className="card">
      <h2>Products</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Cost</th><th>Quantity</th></tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
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
