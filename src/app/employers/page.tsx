import Link from "next/link";

export default function EmployerLandingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Hire aviation talent that's ready to work</h1>
      <p className="text-slate-500 mt-3">
        Post jobs to mechanics, pilots, engineers, and ramp agents actively looking in the industry. Choose your own
        application link, or let candidates apply right on our site.
      </p>
      <Link
        href="/employers/sign-up"
        className="inline-block mt-6 bg-brand-600 text-white px-6 py-3 rounded-md font-medium hover:bg-brand-700 transition-colors"
      >
        Post a Job
      </Link>

      <div className="grid sm:grid-cols-3 gap-6 mt-16 text-left">
        <div>
          <p className="font-medium text-slate-900">Reach real candidates</p>
          <p className="text-sm text-slate-500 mt-1">
            Aviation-specific job seekers, not a general job board buried in noise.
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-900">Apply your way</p>
          <p className="text-sm text-slate-500 mt-1">
            Send applicants to your own site, or accept applications directly through ours.
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-900">Simple, verified listings</p>
          <p className="text-sm text-slate-500 mt-1">
            A quick verification step keeps the platform trustworthy for job seekers.
          </p>
        </div>
      </div>
    </div>
  );
}
