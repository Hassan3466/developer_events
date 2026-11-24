import mongoose, {
  Schema,
  Types,
  type HydratedDocument,
  type Model,
} from "mongoose";
import { EventModel } from "./event.model";

export interface Booking {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingSchema = new Schema<Booking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: EventModel.modelName,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [emailPattern, "Booking email must be a valid email address."],
    },
  },
  { timestamps: true },
);

bookingSchema.pre("save", async function (this: HydratedDocument<Booking>) {
  const email = this.email.trim();
  if (!emailPattern.test(email)) {
    throw new Error("Booking email must be a valid email address.");
  }
  this.email = email.toLowerCase();

  // Confirm the referenced event exists before accepting the booking.
  const eventExists = await EventModel.exists({ _id: this.eventId });
  if (!eventExists) {
    throw new Error("Cannot create booking: the referenced event does not exist.");
  }
});

export const BookingModel: Model<Booking> =
  (mongoose.models.Booking as Model<Booking> | undefined) ??
  mongoose.model<Booking>("Booking", bookingSchema);

export { BookingModel as Booking };
export type BookingDocument = HydratedDocument<Booking>;
