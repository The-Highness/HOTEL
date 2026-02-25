function Services({ services }) {
  return (
    <section className="card">
      <h2>Services</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Cost</th><th>Quantity</th></tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id}>
              <td>{service.name}</td>
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
