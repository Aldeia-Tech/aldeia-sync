export default function Home() {
  return (
    <section
      data-testid="home"
      className="flex h-screen flex-col items-center justify-center"
    >
      <h1 data-testid="home-title" className="text-4xl text-green-900">
        <strong>Aldeia</strong> Tech
      </h1>
      <small data-testid="home-copyright">
        todos dos direitos resevados ao <strong>Aldeia</strong>Tech ©
      </small>
    </section>
  );
}
