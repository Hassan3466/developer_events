"use client";

import Image from "next/image";
import posthog from "posthog-js";

const ExploreBtn = () => {
  return (
    <button
      type="button"
      id="explore-btn"
      className="mt-7 mx-auto flex w-fit items-center justify-center gap-3 rounded-full border border-dark-200 bg-black px-8 py-3.5 font-bold text-white transition-colors hover:bg-neutral-800 max-sm:w-full"
      onClick={() => {
        posthog.capture("event_list_explored");
        posthog.logger.info("event catalog exploration started", {
          action: "event_list_explored",
        });
        console.log("CLICK");
      }}
    >
      View Events
      <Image src="/icons/arrow-down.svg" alt="" width={24} height={24} />
    </button>
  )
}

export default ExploreBtn
