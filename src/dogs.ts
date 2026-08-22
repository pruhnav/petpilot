/** The roster.
 *
 *  One place to change the dogs. The seeder, the agent instructions and the
 *  README all refer to these, so edit here and nowhere else. */
export const DOGS = [
  { name: "Biscuit", breed: "Beagle mix", age: 3, note: "Will trade a kidney for a tennis ball." },
  { name: "Marigold", breed: "Pit bull terrier", age: 7, note: "Senior. Professional sunbeam locator." },
  { name: "Tofu", breed: "Chihuahua / dachshund", age: 1, note: "Small, loud, deeply convinced he is large." },
  { name: "Juniper", breed: "Border collie", age: 5, note: "Needs a job or she will invent one." },
  { name: "Waffles", breed: "Labrador mix", age: 2, note: "Has never met a stranger, only future friends." },
  { name: "Olive", breed: "Greyhound", age: 9, note: "Retired racer. Now a couch with opinions." },
] as const;

/** The brand, in exactly one place.
 *
 *  Everything user-visible derives from this: the console, the public form, the
 *  agent's persona, the Sheet title, the OAuth consent screen. Renaming the
 *  operation should be a one-line change, not a grep. */
export const ORG = "Mateo's Dog System";

/** NOTE: this is matched against the live Sheet by title. Change ORG and the
 *  agent will look for a Sheet that does not exist yet — re-run `npm run seed`. */
export const SHEET_TITLE = `${ORG} — Care Event Log`;

/** Append-only care event log. Column order must match triage.ts instructions. */
export const HEADERS = [
  "Timestamp",
  "Dog ID",
  "Dog Name",
  "Event Type",
  "Description",
  "Confidence",
  "Category",
  "Severity",
  "Action Taken",
  "Human Review",
  "Notes",
] as const;

const daysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

/** A few already-triaged rows so the Sheet isn't empty on a projector. */
export const SEED_ROWS: string[][] = [
  [
    daysAgoIso(5),
    "dog_olive",
    "Olive",
    "routine",
    "Finished full bowl at breakfast",
    "0.94",
    "Medical",
    "routine",
    "logged",
    "no",
    "Routine/Medical: normal appetite note, no clinical concern.",
  ],
  [
    daysAgoIso(3),
    "dog_juniper",
    "Juniper",
    "event",
    "Seems anxious around new volunteers",
    "0.88",
    "Behavior",
    "attention",
    "logged,slack",
    "no",
    "Attention/Behavior: anxiety around strangers is temperament, not injury.",
  ],
  [
    daysAgoIso(1),
    "dog_biscuit",
    "Biscuit",
    "anomaly",
    "Limping on hind leg after yard time",
    "0.91",
    "Medical",
    "urgent",
    "logged,slack,calendar",
    "no",
    "Urgent/Medical: acute limp implies exam; booked vet hold.",
  ],
];
