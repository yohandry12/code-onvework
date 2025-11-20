import React, { useEffect, useRef, useState } from "react";

/**
 * props:
 * - items: array of jobs
 * - renderItem: fn(job) => ReactNode (optional). If omitted, simple card is rendered.
 * - autoplay: boolean (default true)
 * - autoplayInterval: ms (default 4000)
 */
const FeaturedCarousel = ({
  items = [],
  renderItem,
  autoplay = true,
  autoplayInterval = 4000,
}) => {
  const [index, setIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Responsive: adjust itemsPerPage
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setItemsPerPage(1);
      else if (w < 1024) setItemsPerPage(2);
      else setItemsPerPage(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Clamp index when itemsPerPage changes
  useEffect(() => {
    setIndex((prev) => Math.min(prev, pageCount - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage, items.length]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || pageCount <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % pageCount);
    }, autoplayInterval);
    return () => clearInterval(timerRef.current);
  }, [autoplay, autoplayInterval, pageCount]);

  const prev = () => {
    clearInterval(timerRef.current);
    setIndex((i) => (i - 1 + pageCount) % pageCount);
  };
  const next = () => {
    clearInterval(timerRef.current);
    setIndex((i) => (i + 1) % pageCount);
  };

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    const dx = touchStartX.current - touchEndX.current;
    const threshold = 40; // minimal swipe
    if (dx > threshold) next();
    else if (dx < -threshold) prev();
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // compute window slice
  const start = index * itemsPerPage;
  const visibleItems = items.slice(start, start + itemsPerPage);
  // if at last page and not enough items, append from start to fill (nice effect)
  if (visibleItems.length < itemsPerPage && items.length > 0) {
    const needed = itemsPerPage - visibleItems.length;
    visibleItems.push(...items.slice(0, needed));
  }

  return (
    <div className="relative">
      {/* Carousel area */}
      <div
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex gap-6 transition-transform duration-500"
          // not using transform based on index because we slice; keep it simple
        >
          {visibleItems.map((job, i) => (
            <div
              key={job.id || job.id || `job-${start + i}`}
              className="flex-1 min-w-0"
            >
              {renderItem ? (
                renderItem(job)
              ) : (
                <article className="bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                        {job.title}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {job.budget?.currency ?? "EUR"}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {(job.requirements?.skills ?? job.tags ?? [])
                        .slice(0, 4)
                        .map((s, j) => (
                          <span
                            key={j}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium"
                          >
                            {s}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {job.client?.company ||
                        job.client?.name ||
                        "Entreprise inconnue"}
                    </div>
                    <div>
                      <a
                        href={job.url || `/jobs/${job.id || job.id}`}
                        className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Voir
                      </a>
                    </div>
                  </div>
                </article>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      {pageCount > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Précédent"
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            onClick={next}
            aria-label="Suivant"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {pageCount > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pageCount }).map((_, p) => (
            <button
              key={p}
              onClick={() => {
                clearInterval(timerRef.current);
                setIndex(p);
              }}
              aria-label={`Aller à la page ${p + 1}`}
              className={`w-2 h-2 rounded-full ${
                p === index ? "bg-gray-800" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedCarousel;
