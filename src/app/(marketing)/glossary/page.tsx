import { BookOpen } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";

const TERMS: { term: string; definition: string }[] = [
  { term: "A&P (Airframe & Powerplant)", definition: "The FAA certificate required to perform and approve most aircraft maintenance and repairs." },
  { term: "ADS-B (Automatic Dependent Surveillance–Broadcast)", definition: "A system where an aircraft broadcasts its GPS position, letting air traffic control and other aircraft track it more precisely than radar alone." },
  { term: "ATC (Air Traffic Control)", definition: "The service that directs aircraft on the ground and in the air to keep traffic safely separated." },
  { term: "ATP (Airline Transport Pilot)", definition: "The highest level of pilot certificate, required to serve as captain for a scheduled airline." },
  { term: "Ceiling", definition: "The height above the ground of the lowest layer of clouds reported as broken or overcast." },
  { term: "CFI (Certified Flight Instructor)", definition: "A pilot certified to teach other pilots, both on the ground and in flight." },
  { term: "Deadhead", definition: "When a pilot or crew member travels as a passenger (not working) to reposition for their next flight assignment." },
  { term: "ETOPS (Extended-range Twin-engine Operations)", definition: "Rules governing how far a twin-engine airliner may fly from the nearest diversion airport, based on the aircraft and engines' certified reliability." },
  { term: "FBO (Fixed-Base Operator)", definition: "A business at an airport providing fueling, hangar space, and ground services, typically serving general aviation and charter traffic." },
  { term: "Ferry Flight", definition: "A flight used to reposition an aircraft, without passengers or revenue cargo aboard." },
  { term: "Golden Hour", definition: "The critical first hour after a severe traumatic injury, when rapid transport to definitive care -- often by air ambulance -- most improves survival odds." },
  { term: "Ground Stop", definition: "An FAA order temporarily halting departures bound for a specific airport or region, usually due to weather or congestion." },
  { term: "IFR (Instrument Flight Rules)", definition: "Flying by reference to cockpit instruments, used in clouds or low visibility, under air traffic control guidance." },
  { term: "LZ (Landing Zone)", definition: "An improvised or designated site for a helicopter to land -- common terminology in EMS and law enforcement aviation." },
  { term: "MEL (Minimum Equipment List)", definition: "An FAA-approved list of equipment an aircraft is allowed to legally operate without, under specific conditions." },
  { term: "MOS (Military Occupational Specialty)", definition: "The job classification code system used by the U.S. Army and Marine Corps to identify a service member's role, including aviation specialties." },
  { term: "MRO (Maintenance, Repair, and Overhaul)", definition: "A company or facility that performs aircraft maintenance, repair, and overhaul work, often for multiple airline or operator customers." },
  { term: "NOTAM (Notice to Air Missions)", definition: "An official alert about a hazard, closure, or operational change affecting flights at a given location or airspace." },
  { term: "Part 121", definition: "The FAA regulations governing scheduled airline operations -- the rules that airline and most cargo pilots fly under." },
  { term: "Part 135", definition: "The FAA regulations governing charter and on-demand air taxi operations, typically with smaller aircraft and more flexible scheduling than Part 121." },
  { term: "PCS (Permanent Change of Station)", definition: "A military service member's officially ordered relocation to a new duty assignment, often at a different base." },
  { term: "Ramp", definition: "The paved area of an airport where aircraft are parked, loaded, unloaded, and serviced between flights." },
  { term: "Squawk", definition: "The four-digit transponder code air traffic control assigns to an aircraft to identify it on radar." },
  { term: "TFO (Tactical Flight Officer)", definition: "The crew member in a law enforcement aircraft who operates surveillance equipment and coordinates with ground units, freeing the pilot to focus on flying." },
  { term: "Turnaround", definition: "The process of unloading, servicing, refueling, and reloading an aircraft between one flight and the next." },
  { term: "Type Rating", definition: "Additional FAA certification required to act as pilot in command of a specific aircraft model above a certain weight or complexity threshold." },
  { term: "VFR (Visual Flight Rules)", definition: "Flying by visual reference to the ground and horizon in clear weather, rather than by instruments alone." },
  { term: "Wet Lease", definition: "An arrangement where one airline supplies an aircraft, crew, maintenance, and insurance to another airline for a fee, as opposed to a \"dry lease\" of the aircraft alone." },
];

export default function GlossaryPage() {
  return (
    <div>
      <PageHero
        title="Aviation Glossary"
        description="Plain-English definitions for the terms and acronyms you'll run into across the industry."
        icon={BookOpen}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {TERMS.map((t) => (
            <div key={t.term} className="border-b border-white/10 pb-4">
              <p className="font-medium text-white">{t.term}</p>
              <p className="text-sm text-slate-300 mt-1">{t.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
