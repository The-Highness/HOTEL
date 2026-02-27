function Services({ services }) {
  return (
    <section className="card catalog-page services-page">
      <h2>Services 🛎️</h2>
      <p className="catalog-subtitle">Huduma zote za hotel zikiwa organized na clear.</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Cost</th><th>Quantity</th></tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id}>
              <td><span className="item-emoji" aria-hidden="true">🧹</span>{service.name}</td>
              <td>{service.cost ?? service.price}</td>
              <td>{service.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Services;
