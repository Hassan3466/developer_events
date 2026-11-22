
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

        <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/events">Events</Link></li>
            <li><Link href="/create-event">Create Event</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
