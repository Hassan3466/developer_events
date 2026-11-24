import mongoose, {
  Schema,
  Types,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface Event {
  title: string;
  slug?: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const requiredTextFields = [
  "title",
  "description",
  "overview",
  "image",
  "venue",
  "location",
  "date",
  "time",
  "mode",
  "audience",
  "organizer",
] as const;

const datePattern =
  /^([A-Za-z]+)\s+(\d{1,2})(?:\s*[-–—]\s*(\d{1,2}))?,\s*(\d{4})$/;
const timePattern =
  /^(~?)([01]\d|2[0-3]):([0-5]\d)(?:\s*[-–—]\s*([01]\d|2[0-3]):([0-5]\d))?(?:\s+([A-Za-z]{2,6}))?$/;

function toIsoDate(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Event date contains an invalid calendar date.");
  }
  return date.toISOString().slice(0, 10);
}

// Store single dates and ranges as ISO calendar dates instead of display strings.
function normalizeDate(value: string): string {
  const input = value.trim();
  const isoRange = /^(\d{4}-\d{2}-\d{2})\s*\/\s*(\d{4}-\d{2}-\d{2})$/.exec(
    input,
  );
  if (isoRange) {
    return `${toIsoDateFromString(isoRange[1])}/${toIsoDateFromString(isoRange[2])}`;
  }

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (isoDate) {
    return toIsoDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
  }

  const namedDate = datePattern.exec(input);
  if (namedDate) {
    const month = new Date(`${namedDate[1]} 1, 2000`).getMonth() + 1;
    if (Number.isNaN(month)) {
      throw new Error("Event date has an unrecognized month.");
    }

    const year = Number(namedDate[4]);
    const start = toIsoDate(year, month, Number(namedDate[2]));
    if (!namedDate[3]) {
      return start;
    }
    return `${start}/${toIsoDate(year, month, Number(namedDate[3]))}`;
  }

  throw new Error(
    "Event date must be YYYY-MM-DD, an ISO date range, or a date such as January 30–31, 2027.",
  );
}

function toIsoDateFromString(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Event date range must contain ISO dates.");
  }
  return toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

// Normalize times to 24-hour notation while retaining timezone and estimate markers.
function normalizeTime(value: string): string {
  const input = value.trim();
  const match = timePattern.exec(input);
  if (!match) {
    throw new Error(
      "Event time must use 24-hour HH:mm format, optionally as a range with a timezone.",
    );
  }

  const start = `${match[2]}:${match[3]}`;
  const end = match[4] ? `${match[4]}:${match[5]}` : undefined;
  const approximate = match[1];
  const timezone = match[6] ? ` ${match[6].toUpperCase()}` : "";
  return `${approximate}${start}${end ? `–${end}` : ""}${timezone}`;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

const eventSchema = new Schema<Event>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: {
        validator: (items: string[]) =>
          items.length > 0 && items.every((item) => item.length > 0),
        message: "Agenda must contain at least one non-empty item.",
      },
    },
    organizer: { type: String, required: true, trim: true },
    tags: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: {
        validator: (items: string[]) =>
          items.length > 0 && items.every((item) => item.length > 0),
        message: "Tags must contain at least one non-empty item.",
      },
    },
  },
  { timestamps: true },
);

eventSchema.index({ slug: 1 }, { unique: true });

// Validate content, generate a title-derived slug only when needed, then normalize dates.
eventSchema.pre("save", function (this: HydratedDocument<Event>) {
  for (const field of requiredTextFields) {
    if (!this[field]?.trim()) {
      throw new Error(`Event ${field} is required and cannot be empty.`);
    }
  }
  if (
    this.agenda.length === 0 ||
    this.agenda.some((item) => !item.trim())
  ) {
    throw new Error("Event agenda must contain non-empty items.");
  }
  if (this.tags.length === 0 || this.tags.some((tag) => !tag.trim())) {
    throw new Error("Event tags must contain non-empty items.");
  }

  if (this.isModified("title")) {
    const slug = slugify(this.title);
    if (!slug) {
      throw new Error("Event title must contain letters or numbers to create a slug.");
    }
    this.slug = slug;
  } else if (!this.slug?.trim()) {
    throw new Error("Event slug is required.");
  }

  this.date = normalizeDate(this.date);
  this.time = normalizeTime(this.time);
});

export const EventModel: Model<Event> =
  (mongoose.models.Event as Model<Event> | undefined) ??
  mongoose.model<Event>("Event", eventSchema);

export { EventModel as Event };
export type EventDocument = HydratedDocument<Event>;
export type EventId = Types.ObjectId;
