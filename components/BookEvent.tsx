'use client';

import { useState } from "react";

type BookEventProps = {
    eventId: string;
};

const BookEvent = ({ eventId }: BookEventProps) => {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ eventId, email }),
            });

            const result: unknown = await response.json();
            if (!response.ok) {
                const message =
                    typeof result === "object" &&
                    result !== null &&
                    "message" in result &&
                    typeof result.message === "string"
                        ? result.message
                        : "Failed to book the event. Please try again.";
                throw new Error(message);
            }

            setSuccessMessage("Booking successful!");
            setEmail(""); // Clear the input field after successful booking
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setSubmitted(false);
        }
    };                  
  return (
    <div id="book-event">
        {submitted ? (
            <p>Submitting your booking...</p>
        ) : (
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">Book Now</button>
            </form>
        )}
        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
    </div>
  )
}

export default BookEvent        
