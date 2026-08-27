// The real homepage (search, Mapbox airport widget, etc.) is a Sprint 2
// deliverable. This placeholder exists only so the app has something to
// render at "/" while Sprint 1 focuses on ingestion + admin review.
export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-semibold">Aviation Careers</h1>
      <p className="mt-2 text-gray-600">
        Public site coming in Sprint 2. Ingestion + admin review is what
        Sprint 1 is building — see{" "}
        <a href="/admin/jobs/review" className="text-blue-600 underline">
          /admin/jobs/review
        </a>
        .
      </p>
    </main>
  );
}
