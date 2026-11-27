'use client';

import { useState } from "react";

const BookEvent = () => {
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
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error("Failed to book the event. Please try again.");
            }

            setSuccessMessage("Booking successful! Check your email for confirmation.");
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
