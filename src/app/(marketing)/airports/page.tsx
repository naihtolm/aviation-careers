import Link from "next/link";
import { Plane, Briefcase } from "lucide-react";
import { AirportMap } from "@/components/map/AirportMap";
import { getAirports } from "@/features/airports/queries";
import { airportTypeLabel } from "@/lib/airport";

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
                  airportType: a.airport_type,
                  topCareer: a.topCareer,
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
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {a.name} <span className="text-slate-400 font-normal">({code})</span>
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{a.city}, {a.state}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {airportTypeLabel(a.airport_type) && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                            {airportTypeLabel(a.airport_type)}
                          </span>
                        )}
                        <p className="flex items-center gap-1 text-sm text-slate-500">
                          <Briefcase className="w-3.5 h-3.5" />
                          {a.jobCount} open job{a.jobCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
