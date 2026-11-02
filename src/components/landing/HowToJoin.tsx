const steps = [
  { title: "Te llega un enlace", text: "El administrador te manda un enlace de invitación. Sin él no se puede crear cuenta, así que aquí no entra nadie que no esté invitado." },
  { title: "Creas tu cuenta", text: "Eliges tu nombre y tu contraseña. En un minuto estás dentro." },
  { title: "Escribís juntos", text: "Entras en el espacio de tu equipo y empiezas a llenar páginas con los demás." },
];

export function HowToJoin() {
  return (
    <section className="px-6 py-20 sm:px-12 lg:px-20">
      <h2 className="font-serif text-4xl leading-tight font-medium tracking-tight">Cómo se entra</h2>
      <p className="mt-3 max-w-xl text-ink-muted">
        Libreta es privada: solo funciona por invitación, para que tus notas se queden entre tu
        equipo.
      </p>
      <ol className="mt-12 grid gap-10 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span aria-hidden className="font-hand text-5xl leading-none text-accent">
              {i + 1}
            </span>
            <div>
              <h3 className="font-serif text-xl font-medium">{step.title}</h3>
              <p className="mt-2 text-ink-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
