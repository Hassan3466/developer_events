import { Schema, model, models, Document } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    overview: {
      type: String,
      required: [true, 'Overview is required'],
      trim: true,
      maxlength: [500, 'Overview cannot exceed 500 characters'],
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      enum: {
        values: ['online', 'offline', 'hybrid'],
        message: 'Mode must be either online, offline, or hybrid',
      },
    },
    audience: {
      type: String,
      required: [true, 'Audience is required'],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, 'Agenda is required'],
      validate: {
        validator: (v: string[]) => v.length > 0 && v.every((item) => item.trim().length > 0),
        message: 'At least one non-empty agenda item is required',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: (v: string[]) => v.length > 0 && v.every((item) => item.trim().length > 0),
        message: 'At least one non-empty tag is required',
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Normalize date and time before schema validation so callers can validate before uploading.
EventSchema.pre('validate', function () {
  const event = this as IEvent;

  if (event.isModified('date')) {
    event.date = normalizeDate(event.date);
  }

  if (event.isModified('time')) {
    event.time = normalizeTime(event.time);
  }
});

// Preserve title-derived slugs, falling back to the document ID for non-Latin titles.
EventSchema.pre('save', function () {
  const event = this as IEvent;

  if (event.isModified('title') || event.isNew) {
    event.slug = generateSlug(event.title) || event._id.toString();
  }
});

// Helper function to generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to normalize date to ISO format
function normalizeDate(dateString: string): string {
  const trimmedDate = dateString.trim();
  const rangeMatch = trimmedDate.match(/^(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    return `${normalizeSingleDate(rangeMatch[1])}/${normalizeSingleDate(rangeMatch[2])}`;
  }

  const namedDateMatch = trimmedDate.match(
    /^([A-Za-z]+)\s+(\d{1,2})(?:\s*[–-]\s*(?:([A-Za-z]+)\s+)?(\d{1,2}))?,?\s+(\d{4})$/,
  );
  if (namedDateMatch) {
    const [, startMonth, startDay, endMonth, endDay, year] = namedDateMatch;
    const start = normalizeNamedDate(startMonth, startDay, year);
    if (!endDay) {
      return start;
    }

    const end = normalizeNamedDate(endMonth || startMonth, endDay, year);
    return `${start}/${end}`;
  }

  return normalizeSingleDate(trimmedDate);
}

function normalizeNamedDate(monthName: string, day: string, year: string): string {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const normalizedMonth = monthName.toLowerCase();
  const monthIndex = months.findIndex(
    (month) => month === normalizedMonth || month.slice(0, 3) === normalizedMonth,
  );

  if (monthIndex < 0) {
    throw new Error('Invalid date format');
  }

  const isoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
  return normalizeSingleDate(isoDate);
}

function normalizeSingleDate(dateString: string): string {
  const trimmedDate = dateString.trim();
  const isoMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const date = new Date(`${trimmedDate}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== trimmedDate) {
      throw new Error('Invalid date format');
    }

    return trimmedDate;
  }

  const date = new Date(trimmedDate);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date.toISOString().split('T')[0];
}

// Helper function to normalize time format
function normalizeTime(timeString: string): string {
  // Handle various time formats and convert to HH:MM (24-hour format)
  const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
  const match = timeString.trim().match(timeRegex);
  
  if (!match) {
    throw new Error('Invalid time format. Use HH:MM or HH:MM AM/PM');
  }
  
  const originalHours = Number(match[1]);
  let hours = originalHours;
  const minutes = match[2];
  const period = match[4]?.toUpperCase();
  
  if (period) {
    if (originalHours < 1 || originalHours > 12) {
      throw new Error('Invalid time values');
    }

    // Convert 12-hour to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else if (hours < 0 || hours > 23) {
    throw new Error('Invalid time values');
  }
  
  if (Number(minutes) < 0 || Number(minutes) > 59) {
    throw new Error('Invalid time values');
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Create unique index on slug for better performance
EventSchema.index({ slug: 1 }, { unique: true });

// Create compound index for common queries
EventSchema.index({ date: 1, mode: 1 });

const Event = models.Event || model<IEvent>('Event', EventSchema);

export default Event;