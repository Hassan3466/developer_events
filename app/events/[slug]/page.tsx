import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import Event from "@/database/event.model";
import connectDB from "@/lib/mongodb";
import BookEvent from "@/components/BookEvent";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

type EventDetailItemProps = {
  icon: string;
  alt: string;
  label: string;
  value: string;
};

function EventDetailItem({ icon, alt, label, value }: EventDetailItemProps) {
  return (
    <div className="flex-row-gap-2 items-center">
      <Image src={icon} alt={alt} width={20} height={20} />
      <p>
        <span className="font-semibold">{label}:</span> {value}
      </p>
    </div>
  );
}

function EventAgenda({ items }: { items: string[] }) {
  return (
    <section className="agenda">
      <h2>Agenda</h2>
      <ul>
        {items.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function EventTags({ tags }: { tags: string[] }) {
  return (
    <section className="flex-col-gap-2">
      <h2>Tags</h2>
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li className="pill" key={tag}>
            {tag}
          </li>
        ))}
      </ul>
    </section>
  );
}

async function EventDetailsContent({ params }: EventPageProps) {
  await connection();
  const { slug } = await params;
  await connectDB();

  const event = await Event.findOne({ slug }).lean();
  if (!event) {
    notFound();
  }

  const bookings = 10;

  const similarEvents = await getSimilarEventsBySlug(slug);

  return (
    <section id="event">
      <div className="header">
        <h1>{event.title}</h1>
        <p>{event.description}</p>
      </div>

      <div className="details">
        <div className="content">
          <Image
            src={event.image}
            alt={`${event.title} banner`}
            width={1200}
            height={675}
            className="banner"
            priority
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{event.overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <EventDetailItem
              icon="/icons/location.svg"
              alt=""
              label="Location"
              value={event.location}
            />
            <EventDetailItem
              icon="/icons/calendar.svg"
              alt=""
              label="Date"
              value={event.date}
            />
            <EventDetailItem
              icon="/icons/clock.svg"
              alt=""
              label="Time"
              value={event.time}
            />
            <EventDetailItem
              icon="/icons/mode.svg"
              alt=""
              label="Mode"
              value={event.mode}
            />
            <EventDetailItem
              icon="/icons/audience.svg"
              alt=""
              label="Audience"
              value={event.audience}
            />
          </section>

          <EventAgenda items={event.agenda} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{event.organizer}</p>
          </section>

          <EventTags tags={event.tags} />
        </div>

        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm font-bold">
                Join {bookings} people who have booked this event.
              </p>
            ) : (
              <p className="text-sm font-bold">
                Be the first to book this event!
              </p>
            )}
            <BookEvent eventId={event._id.toString()} />
          </div>
        </aside>
      </div>

      <div className = "flex w-full flex-col gap-4 mt-20">
        <h2>Similar Events</h2>
        <div className = "events">
          {similarEvents.length > 0 ? (
            similarEvents.map((similarEvent) => (
              <div key={similarEvent.slug} className="event-card">
                <Image
                  src={similarEvent.image}
                  alt={`${similarEvent.title} banner`}
                  width={400}
                  height={225}
                  className="banner"
                />
                <h3>{similarEvent.title}</h3>
                <p>{similarEvent.description}</p>
                <p>
                  {similarEvent.date} at {similarEvent.time}
                </p>
                <p>{similarEvent.location}</p>
                <a href={`/events/${similarEvent.slug}`}>View Details</a>
              </div>
            ))
          ) : (
            <p>No similar events found.</p>
          )}  
        </div>
      </div>

    </section>
  );
}



export default function EventDetailsPage({ params }: EventPageProps) {
  return (
    <Suspense fallback={<p>Loading event details...</p>}>
      <EventDetailsContent params={params} />
    </Suspense>
  );
}
