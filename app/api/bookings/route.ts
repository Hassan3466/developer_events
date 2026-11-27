import { NextResponse } from "next/server";
import { Types } from "mongoose";

import Booking from "@/database/booking.model";
import Event from "@/database/event.model";
import connectDB from "@/lib/mongodb";

type BookingRequestBody = {
  eventId: string;
  email: string;
};

function isBookingRequestBody(value: unknown): value is BookingRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "eventId" in value &&
    typeof value.eventId === "string" &&
    "email" in value &&
    typeof value.email === "string"
  );
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isBookingRequestBody(body)) {
    return NextResponse.json(
      { message: "Both eventId and email are required." },
      { status: 400 },
    );
  }

  const eventId = body.eventId.trim();
  const email = body.email.trim().toLowerCase();

  if (!Types.ObjectId.isValid(eventId)) {
    return NextResponse.json({ message: "Invalid event ID." }, { status: 400 });
  }

  try {
    await new Booking({ eventId, email }).validate();
    await connectDB();

    const event = await Event.findById(eventId).select("_id").lean();
    if (!event) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const booking = await Booking.create({ eventId, email });

    return NextResponse.json(
      { message: "Booking created successfully.", bookingId: booking.id },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { message: "This email is already booked for this event." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    console.error("Failed to create booking:", error);
    return NextResponse.json(
      { message: "Unable to create booking. Please try again later." },
      { status: 500 },
    );
  }
}
