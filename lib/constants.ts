export interface Event {
  title: string;
  image: string;
  slug: string;
  location: string;
  date: string;
  time: string;
}

// 2027 session schedules are not published yet; these are indicative local-time windows.
export const events: Event[] = [
  {
    title: "FOSDEM 2027",
    image: "/images/event1.png",
    slug: "fosdem-2027",
    location: "Brussels, Belgium",
    date: "January 30–31, 2027",
    time: "~09:00–17:00 CET",
  },
  {
    title: "KubeCon + CloudNativeCon Europe 2027",
    image: "/images/event2.png",
    slug: "kubecon-cloudnativecon-europe-2027",
    location: "Barcelona, Spain",
    date: "March 15–18, 2027",
    time: "~09:00–17:00 CET",
  },
  {
    title: "Open Nexus China 2027",
    image: "/images/event3.png",
    slug: "open-nexus-china-2027",
    location: "Shanghai, China",
    date: "May 12–13, 2027",
    time: "~09:00–17:00 CST",
  },
  {
    title: "KubeCon + CloudNativeCon Japan 2027",
    image: "/images/event4.png",
    slug: "kubecon-cloudnativecon-japan-2027",
    location: "Yokohama, Japan",
    date: "August 25–26, 2027",
    time: "~09:00–17:00 JST",
  },
  {
    title: "Open Nexus India 2027",
    image: "/images/event5.png",
    slug: "open-nexus-india-2027",
    location: "Bengaluru, India",
    date: "September 9–10, 2027",
    time: "~09:00–17:00 IST",
  },
  {
    title: "KubeCon + CloudNativeCon North America 2027",
    image: "/images/event6.png",
    slug: "kubecon-cloudnativecon-north-america-2027",
    location: "New Orleans, Louisiana, USA",
    date: "November 8–11, 2027",
    time: "~09:00–17:00 CST",
  },
];
