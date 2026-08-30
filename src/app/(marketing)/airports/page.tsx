import Link from "next/link";
import { AirportMap } from "@/components/map/AirportMap";
import { getAirports } from "@/features/airports/queries";

export default async function AirportDirectoryPage() {
  const airports = await getAirports();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Airport Directory</h1>
      <p className="text-slate-500 mt-1">Browse aviation jobs and employers by airport.</p>

      {airports.length === 0 ? (
        <p className="text-slate-500 mt-8">No airports listed yet.</p>
      ) : (
        <>
          <div className="mt-6">
            <AirportMap
              markers={airports.map((a: any) => {
                const code = a.iata_code ?? a.icao_code;
                return {
                  id: a.id,
                  latitude: a.latitude,
                  longitude: a.longitude,
                  name: a.name,
                  code,
                  jobCount: a.jobCount,
                  companies: a.companies,
                  href: `/airports/${code}`,
                };
              })}
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {airports.map((a: any) => {
              const code = a.iata_code ?? a.icao_code;
              return (
                <Link
                  key={a.id}
                  href={`/airports/${code}`}
                  className="border rounded-lg p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <p className="font-medium text-slate-900">
                    {a.name} <span className="text-slate-400 font-normal">({code})</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {a.city}, {a.state} · {a.jobCount} open job{a.jobCount === 1 ? "" : "s"}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
