/** Shown while a project page loads: mirrors the real layout so nothing jumps when content arrives. */
export default function ProjectLoading() {
  const bar = 'animate-pulse rounded-full bg-forest/10';
  return (
    <div className="bg-petal" role="status" aria-label="Loading project">
      <div className="h-[78vh] min-h-[520px] animate-pulse bg-forest/15" />
      <div className="mx-auto w-full max-w-[1264px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="grid content-start gap-4">
            <div className={`${bar} h-5 w-full`} />
            <div className={`${bar} h-5 w-11/12`} />
            <div className={`${bar} h-5 w-2/3`} />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-forest/10" />
              ))}
            </div>
          </div>
          <div className="h-[420px] animate-pulse rounded-xl bg-forest/10" />
        </div>
      </div>
    </div>
  );
}
