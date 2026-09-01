-- =========================================================
-- 026_seed_career_content_for_new_careers.sql
-- Real career guide content (overview, responsibilities,
-- requirements, training/career path, pros/considerations) for the
-- 8 careers added in 022 -- these were showing "Detailed guide
-- coming soon" on their career detail pages until now.
-- Pure data insert into career_content, matches the shape used by
-- the existing Aerospace Engineer/Aircraft Mechanic/Airline Pilot
-- rows from the original seed.
-- =========================================================

insert into public.career_content (career_id, overview, responsibilities, requirements, training_path, career_path, work_environment, pros, considerations, seo_title, seo_description, published_at)
select c.id, v.overview, v.responsibilities::jsonb, v.requirements::jsonb, v.training_path, v.career_path, v.work_environment, v.pros::jsonb, v.considerations::jsonb, v.seo_title, v.seo_description, now()
from public.careers c
join (values
  ('military-pilot',
   'Military pilots fly fixed-wing aircraft or helicopters for the armed forces, performing combat, reconnaissance, transport, and training missions under military command. The role combines advanced flight skill with military leadership and mission planning responsibilities.',
   '["Fly combat, transport, reconnaissance, or training missions as directed by military command","Plan missions including routing, fuel, weather, and risk assessment","Operate and manage complex weapons, navigation, and communication systems in flight","Maintain flight readiness through recurring training and evaluations","Lead and coordinate with aircrew and ground support personnel"]',
   '["Commissioned officer status (varies by branch and pilot track)","Completion of military flight school and aircraft-specific qualification training","U.S. citizenship and security clearance eligibility"]',
   'Commissioned officer training followed by military flight school, which varies significantly by branch (Air Force, Navy, Army, Marines, Coast Guard) and aircraft type. Training typically takes one to two years before an initial assignment.',
   'Military pilots progress through aircraft qualifications and leadership roles within their service, and many transition into airline, cargo, corporate, or law enforcement flying after their service commitment.',
   'Varies widely by assignment -- from stateside training bases to deployed and combat environments.',
   '["Extensive, fully-funded flight training","Strong preparation for civilian aviation careers after service","Significant leadership and mission responsibility early in career"]',
   '["Multi-year service commitment required","Frequent relocation and deployment","Demanding physical and security clearance requirements"]',
   'Military Pilot Career Guide — Training, Path to Civilian Aviation',
   'What military pilots do, how to become one, and how the experience translates to civilian flying careers.'),

  ('defense-systems-technician',
   'Defense systems technicians inspect, maintain, and repair avionics, weapons, and mission systems on military aircraft, often working for the armed forces or defense contractors supporting government aviation programs.',
   '["Diagnose and repair avionics, radar, and weapons systems on military aircraft","Perform scheduled inspections and maintenance per military or contractor technical orders","Document maintenance actions and parts usage in compliance systems","Coordinate with engineers on recurring system issues","Maintain proficiency with classified or restricted systems as required"]',
   '["Military technical training or an A&P certification plus relevant systems experience","Ability to obtain and maintain a security clearance","Strong troubleshooting skills with electronic and mechanical systems"]',
   'Many enter through military technical training programs; others transition from A&P certification into defense contractor roles with on-the-job systems training.',
   'Technicians can advance into senior/lead technician roles, quality assurance, or engineering support positions within defense contracting.',
   'Military bases, defense contractor facilities, or depot maintenance sites -- often requiring a security clearance to access the work area.',
   '["Strong, stable demand from government contracts","Often includes security clearance premium pay","Clear path from military service into contractor roles"]',
   '["Security clearance process can take months","Some roles require willingness to travel or relocate to contractor sites","Access to certain systems restricted by classification level"]',
   'Defense Systems Technician Career Guide — Requirements, Pay, and Path',
   'What defense systems technicians do, what training and clearance they need, and how to break into the field.'),

  ('cargo-pilot',
   'Cargo pilots fly freight aircraft for carriers and logistics companies, often on overnight routes, transporting goods rather than passengers. The work follows the same certification path as passenger airline flying but with different scheduling and route patterns.',
   '["Fly scheduled freight routes, often overnight or early morning","Conduct pre-flight planning including weight and balance for cargo loads","Coordinate with ground crews on loading and cargo handling","Complete required flight and duty time documentation","Respond to weather and mechanical delays while maintaining delivery schedules"]',
   '["Commercial pilot certificate with instrument rating","FAA Airline Transport Pilot (ATP) certificate for most carrier positions","Type rating for the specific cargo aircraft flown"]',
   'Same core path as airline flying -- commercial certificate, instrument rating, and building flight hours toward the ATP certificate -- followed by carrier-specific type rating training.',
   'Pilots often start on smaller cargo aircraft or as first officers before moving to larger freighters or captain positions, with some later transitioning to passenger airlines.',
   'Frequent overnight and early-morning flying, based out of cargo hub airports.',
   '["Often faster hiring and upgrade timelines than passenger airlines","Predictable route networks","Strong demand tied to e-commerce and logistics growth"]',
   '["Overnight and irregular schedules","Time away from home on multi-day trips","Physically demanding circadian rhythm disruption"]',
   'Cargo Pilot Career Guide — Salary, Training, and Path to the Cockpit',
   'What cargo pilots do, what certificates they need, and how the career path compares to passenger airlines.'),

  ('ramp-agent',
   'Ramp agents handle baggage and cargo loading/unloading, aircraft marshalling, and other ground operations that keep flights moving on schedule. It''s one of the most accessible entry points into the aviation industry.',
   '["Load and unload baggage, cargo, and mail from aircraft","Marshal aircraft to and from gates using standard hand signals","Operate ground support equipment such as tugs, belt loaders, and de-icing trucks","Perform weight and balance loading per the load plan","Conduct visual safety checks around the aircraft during turnaround"]',
   '["High school diploma or equivalent","Ability to lift 50+ lbs repeatedly and work outdoors in all weather","Pass a background check for airport security badging"]',
   'No degree required -- most training happens on the job, typically over a few weeks, covering safety procedures, equipment operation, and airline-specific processes.',
   'Ramp agents often advance into lead or supervisor roles, or use the role as a stepping stone into dispatch, operations, or other airline/airport ground career paths.',
   'Outdoors on the airport ramp in all weather conditions, working around aircraft and heavy equipment on tight turnaround schedules.',
   '["Low barrier to entry -- no degree or prior experience required","Often includes flight benefits at airlines","Physical, active work rather than a desk job"]',
   '["Physically demanding, outdoor work in extreme weather","Early morning, overnight, and weekend shifts are common","Lower starting pay than most other aviation careers"]',
   'Ramp Agent Career Guide — Requirements, Pay, and Career Path',
   'What ramp agents do, what it takes to get hired, and where the role can lead.'),

  ('corporate-pilot',
   'Corporate pilots operate private or charter aircraft for businesses and individuals, offering flexible, on-demand air travel outside the scheduled airline system.',
   '["Fly business jets or turboprops for a company flight department or charter operator","Plan trips around client schedules, often with limited advance notice","Handle a broader range of duties than airline pilots, including some flight planning and passenger coordination","Maintain aircraft-specific type rating currency and recurrent training","Coordinate with maintenance on aircraft airworthiness before flights"]',
   '["Commercial pilot certificate with instrument rating","Type rating for the specific business jet flown, where required","Strong customer service skills given direct client interaction"]',
   'Commercial pilot certificate and instrument rating, followed by aircraft-specific type rating training, often funded by the hiring flight department or charter operator.',
   'Pilots typically build hours in smaller aircraft before moving into larger business jets, with some progressing to chief pilot or flight department management roles.',
   'Variable schedule driven by client needs -- can include short-notice trips and irregular hours, based at a home airport or company hangar.',
   '["More schedule variety than airline flying","Direct client interaction and smaller crew environment","Access to newer, well-maintained aircraft"]',
   '["Less predictable schedule than airline routes","Smaller crew means broader individual responsibility","Fewer positions available than at major airlines"]',
   'Corporate Pilot Career Guide — Salary, Requirements, and Path',
   'What corporate pilots do, what it takes to fly private and charter aircraft, and how the career compares to the airlines.'),

  ('flight-instructor',
   'Certified flight instructors (CFIs) teach ground and flight lessons to student pilots, a common entry point into a professional flying career while building flight hours.',
   '["Teach ground school and in-flight lessons to student pilots","Evaluate student progress and sign off on required training milestones","Conduct pre-solo and pre-checkride readiness reviews","Maintain training records per FAA requirements","Model safe flying practices and decision-making for students"]',
   '["Commercial pilot certificate","FAA Certified Flight Instructor (CFI) certificate","Strong communication and teaching ability"]',
   'After earning a commercial pilot certificate, candidates complete CFI-specific training and pass FAA knowledge and practical exams to earn the instructor certificate.',
   'Most CFIs use the role to build flight hours toward airline or corporate minimums, typically instructing for one to two years before moving on; some make instruction a long-term career.',
   'Based at a flight school or FBO, with a mix of ground classroom instruction and in-aircraft flying with students.',
   '["Builds flight hours while earning a paycheck","Strengthens flying skills and judgment through teaching","Flexible entry point into professional aviation"]',
   '["Lower pay than most other pilot roles","Requires patience for teaching students at varying skill levels","Weather and student availability can make scheduling unpredictable"]',
   'Flight Instructor (CFI) Career Guide — Requirements, Pay, and Path',
   'What flight instructors do, how to become a CFI, and how the role fits into a professional pilot career path.'),

  ('flight-paramedic',
   'Flight paramedics deliver advanced emergency medical care aboard air ambulances, stabilizing and treating critically ill or injured patients during transport between accident scenes, hospitals, and trauma centers.',
   '["Provide advanced life support care to patients during helicopter or fixed-wing transport","Coordinate with pilots, receiving hospitals, and dispatch during time-critical transports","Operate in-flight medical equipment including ventilators and cardiac monitors","Perform scene response and inter-facility transport flights","Maintain required medical and flight safety certifications"]',
   '["Paramedic certification (or RN with critical care experience, depending on program)","Flight-specific critical care training, often including FP-C certification","Physical fitness for confined-space, high-stress medical work in flight"]',
   'Typically requires several years of ground EMS or ICU experience before transitioning into flight medicine, plus additional critical-care and flight physiology training.',
   'Experienced flight medics can move into lead medic, base manager, or clinical education roles within an air medical program.',
   'Fast-paced and high-stress, working in a small aircraft cabin under time pressure, often at all hours including nights and weekends.',
   '["Meaningful, high-impact work saving lives in critical situations","Higher pay than most ground EMS roles","Advanced clinical scope of practice"]',
   '["High-stress environment with life-or-death decisions","Physically demanding in a confined aircraft space","Requires extensive prior EMS/critical care experience to qualify"]',
   'Flight Paramedic Career Guide — Requirements, Pay, and Path',
   'What flight paramedics do, what experience and certifications they need, and how to break into air medical transport.'),

  ('law-enforcement-pilot',
   'Law enforcement pilots operate aircraft for police and sheriff''s departments, supporting search and rescue, aerial surveillance, pursuit, and tactical support missions.',
   '["Fly helicopters or fixed-wing aircraft in support of ground patrol operations","Conduct aerial surveillance, pursuit support, and search and rescue missions","Operate onboard cameras, thermal imaging, and communication equipment","Coordinate flight operations with dispatch and ground units in real time","Maintain aircraft readiness and complete required flight training"]',
   '["Commercial pilot certificate, often with a rotorcraft rating for helicopter units","Prior law enforcement officer experience or military flight training, depending on the department","Ability to pass law enforcement background and psychological screening"]',
   'Most law enforcement pilots are sworn officers who apply to a department''s aviation unit after gaining patrol experience, or come in as pilots with military or civilian flight backgrounds hired directly into a unit.',
   'Pilots can advance to senior pilot, aviation unit supervisor, or training officer roles within the department''s air support division.',
   'On-call and shift-based work supporting active law enforcement operations, including night flying and high-stress tactical situations.',
   '["Directly supports public safety with meaningful, high-visibility work","Often better and more stable schedule than commercial flying","Access to specialized aircraft and equipment"]',
   '["Requires either a law enforcement career path or hard-to-get direct-hire pilot slots","On-call availability and irregular hours","High-stress tactical and emergency situations"]',
   'Law Enforcement Pilot Career Guide — Requirements, Pay, and Path',
   'What police and sheriff''s department pilots do, what it takes to get hired, and how the career path works.')
) as v(slug, overview, responsibilities, requirements, training_path, career_path, work_environment, pros, considerations, seo_title, seo_description)
  on v.slug = c.slug
where c.slug in (
  'military-pilot','defense-systems-technician','cargo-pilot','ramp-agent',
  'corporate-pilot','flight-instructor','flight-paramedic','law-enforcement-pilot'
);
