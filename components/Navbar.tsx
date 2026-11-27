
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  return (
    <header>
      <nav>
        <Link href="/" className="logo">
          <Image src="/logo.png" alt="Logo" width={25} height={25} />

          <p>DevEvent</p>
        </Link>

        <div className="flex flex-row items-center gap-6">
          <Link href="/">Home</Link>
          <Link href="/events">Events</Link>
          <Link href="/create-event">Create Event</Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
