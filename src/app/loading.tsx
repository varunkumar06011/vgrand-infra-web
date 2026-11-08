export default function Loading() {
  return (
    <div className="min-h-screen bg-petal flex flex-col items-center justify-center gap-5" role="status" aria-label="Loading">
      <div className="dither-bg absolute inset-0 opacity-50" aria-hidden />
      <div className="relative flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full bg-meadow-600 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="relative font-heading text-xl text-forest">
        V Grand <span className="text-meadow-600">Infra</span>
      </p>
    </div>
  );
}
