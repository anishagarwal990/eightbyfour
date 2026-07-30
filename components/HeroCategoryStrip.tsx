import Image from "next/image";

/** Fixed-position frame in the hero's side margins; the photo inside crossfades between categories. */
export function HeroCategoryStrip({ images, side }: { images: string[]; side: "left" | "right" }) {
  return (
    <div
      className={`pointer-events-none absolute top-1/2 hidden -translate-y-1/2 2xl:block ${
        side === "left" ? "left-10" : "right-10"
      }`}
      aria-hidden="true"
    >
      <div className="relative h-[340px] w-[130px] overflow-hidden rounded-sm shadow-[var(--shadow-md)]">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="130px"
            className="hero-crossfade-img object-cover"
            style={{ animationDelay: `${i * (8 / images.length)}s` }}
          />
        ))}
      </div>
    </div>
  );
}
