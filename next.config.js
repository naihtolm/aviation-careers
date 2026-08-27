/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actions default to a 1MB request body limit -- resume
    // uploads (PDF/DOCX, up to 10MB per the storage bucket's own limit)
    // go through uploadResume(), a Server Action, so this needs raising
    // to match.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // pdf-parse wraps pdfjs-dist, which dynamically imports its own worker
  // script (pdf.worker.mjs) relative to its own package directory at
  // runtime. Turbopack/webpack bundling for Next.js server code doesn't
  // trace that dynamic import correctly, breaking it. Marking these as
  // external tells Next.js to leave them as plain Node requires instead
  // of bundling them, so pdfjs-dist's own relative-path resolution works
  // the way it's designed to.
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
  // serverExternalPackages fixes bundling, but Vercel's deployment file
  // tracer (a separate step that decides which node_modules files
  // actually ship with the serverless function) still didn't pick up
  // pdfjs-dist's worker script -- confirmed live: this worked locally
  // but failed on Vercel with "Cannot find module
  // .../pdfjs-dist/legacy/build/pdf.worker.mjs" at /var/task/. Explicitly
  // including it is the documented fix for a file that exists in the
  // package but doesn't make the trace.
  outputFileTracingIncludes: {
    "/dashboard/resume": ["./node_modules/pdfjs-dist/**/*.mjs"],
  },
};

module.exports = nextConfig;
