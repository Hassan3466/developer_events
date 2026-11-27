import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import Event from "@/database/event.model";
import connectDB from "@/lib/mongodb";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { Suspense } from "react";

type EventSummary = {
  title: string;
  image: string;
  slug: string;
  location: string;
  date: string;
  time: string;
};

async function getEvents(): Promise<EventSummary[]> {
  "use cache";
  cacheLife("hours");

  await connectDB();
  const events = await Event.find()
    .select("title image slug location date time")
    .sort({ createdAt: -1 })
    .lean();

  return events.map(({ title, image, slug, location, date, time }) => ({
    title,
    image,
    slug,
    location,
    date,
    time,
  }));
}

async function HomePageContent() {
  await connection();

  let events: EventSummary[];
  try {
    events = await getEvents();
  } catch (error) {
    console.error("Unable to load events:", error);
    return (
      <section>
        <p role="alert">Unable to load events. Please try again later.</p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-center max-sm:text-3xl">
        The Hub for Every Developer: Discover, Connect, and Elevate Your Skills with Our Developer Events
      </h1>
      <p className="text-center mt-5">
        Hackathon, Meetups, and Conferences, All in One Place.
      </p>
      <ExploreBtn/>

      <div className = "mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className = "events">
          {events.map((event) => (
            <li key={event.slug}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading events...</p>}>
      <HomePageContent />
    </Suspense>
  );
}
