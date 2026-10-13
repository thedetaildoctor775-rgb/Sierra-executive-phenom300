# Sierra Executive operations dashboard

Matches the United Virtual airline OS structure with the commercial OS navy and blue styling: light cards, dark sidebar, operations metrics, fleet overview, operations pulse, and a filterable flight table.

## Implemented

- Operations, Schedule, Dispatch, Fleet, Passengers, Crew & realism, Ground Ops, and Finance navigation connected to the existing charter workflows.
- Flight table includes the active accepted charter, planned dossier legs, and completed logs. Market offers remain in Charter Market.
- Dispatch shows the accepted route, load, charter revenue, imported OFP, and a readiness checklist.
- SimBrief preparation includes SXR flight number, actual aircraft model and registration, passengers, cargo, pound units, and departure date/time converted from the existing local scheduling fields to UTC.
- Release checks require assigned aircraft, available and qualified crew, simulated duty/rest compliance, maintenance clearance, matching imported OFP route/type/registration, route, and block fuel.
- Signed releases save through the existing career state. Planning, aircraft, load, crew assignment, or OFP changes invalidate the release fingerprint; readiness is rechecked before predeparture progression.
- New progression controls use existing duty, fuel, boarding, departure, landing, parking, and completion functions. Existing logs, aircraft locations, invoices, and finances remain authoritative.
- Sidebar navigation is no longer forced back to Operations Center by its periodic timer. Programmatic links leave operations mode correctly.
- Fleet, accepted charters, career state, local storage keys, Supabase configuration, and current hosting are retained.

## Verification

Run `node tests/airline-style.test.cjs` from the repository root. Checks cover route/type mismatch, maintenance hold, exact crew qualification, duty/rest limits, release invalidation, SimBrief parameters, flight-table deduplication, state preservation, loader integration, navigation fixes, and JavaScript syntax.

Browser visual QA and live signed-in testing were not available in the implementation environment. Test iPad layout, cloud save/reload, live OFP import, FBO/weather services, and end-to-end flight completion on the deployed application. Legacy workflow controls remain available; the new release checks apply to the new Dispatch progression controls. Departure fields retain their existing local-time meaning; the header clock is UTC. Flight tracking remains manual.

## Primary page completion

Crew, Passengers, FBOs, Finance, Charter Market, Maintenance, and VIP Clients now have dedicated commercial-style screens. Crew mutations use the existing realism store with qualification, duty, rest, and assignment conflict validation. Passenger, handling, and finance forms save through the existing career functions and fields. Maintenance and client changes persist in the existing realism store. `node tests/crew-actions.test.cjs` verifies those store actions. Crew and client records retain the existing device-local storage behavior.
