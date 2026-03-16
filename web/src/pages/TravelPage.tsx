import { useState } from "react";
import { Plane, AlertTriangle, Building2, Banknote } from "lucide-react";
import { useTravelAgent, useBookFlight, type Flight } from "../hooks/useTravelAgent";
import { Loader } from "../components/ui/Loader";

export function TravelPage() {
  const [query, setQuery] = useState("");
  const { mutate, data, isPending, error } = useTravelAgent();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBookedFlight(null);
    mutate(query);
  };

  const { mutate: bookFlight, isPending: isBooking, error: bookError, data: bookData } = useBookFlight();
  const [bookedFlight, setBookedFlight] = useState<Flight | null>(null);

  const handleBookFlight = (flight: Flight) => {
    setBookedFlight(flight);
    bookFlight(flight);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col p-4 sm:p-8 lg:p-10">
      
      {/* ── Header & Search ── */}
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-wide uppercase"
          style={{ background: "color-mix(in srgb, var(--c-purple) 15%, transparent)", color: "var(--c-purple)", border: "1px solid color-mix(in srgb, var(--c-purple) 30%, transparent)" }}
        >
          <Plane className="h-4 w-4" />
          AI Travel Agent
        </div>
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--c-text)" }}>
          Plan Your Next Adventure
        </h1>
        <p className="mb-8 max-w-2xl text-[15px]" style={{ color: "var(--c-text-muted)" }}>
          Describe your dream trip. I'll search for the cheapest flights and best accommodations tailored just for you.
        </p>

        <form onSubmit={handleSearch} className="relative w-full max-w-2xl" suppressHydrationWarning>
          <input
            type="text"
            className="w-full rounded-2xl py-4 pl-6 pr-32 text-[16px] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--c-purple)] placeholder:text-[var(--c-text-subtle)]"
            style={{ background: "var(--c-surface)", color: "var(--c-text)", border: "1px solid var(--c-border)" }}
            placeholder="e.g. Find me a cheap weekend trip to Miami from NYC"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !query.trim()}
            className="cursor-pointer absolute right-2 top-2 bottom-2 rounded-xl px-6 font-semibold shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: "var(--c-purple)", color: "white" }}
          >
            Search
          </button>
        </form>

        {/* ── Quick Prompts ── */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {[
            "Find me a cheap weekend trip to Miami from NYC and a hotel.",
            "I need flights from London to Tokyo for 2 weeks in October.",
            "Look for a romantic luxury resort in Maldives for 5 nights.",
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(promptText);
                mutate(promptText);
              }}
              disabled={isPending}
              className="cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--c-border)] disabled:opacity-50"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* ── Status & Errors ── */}
      {isPending && (
        <div className="mt-10 flex flex-col items-center justify-center">
          <Loader />
          <p className="mt-4 text-sm font-medium animate-pulse" style={{ color: "var(--c-text-muted)" }}>
            Searching airlines and scanning hotel deals...
          </p>
        </div>
      )}

      {error && (
        <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--c-red) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--c-red) 20%, transparent)", color: "var(--c-red)" }}>
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-semibold">Search Failed</h3>
            <p className="mt-1 text-[13px] opacity-90">{error.message}</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {data && !isPending && (
        <div className="flex animate-in fade-in slide-in-from-bottom-4 flex-col gap-10">

          {/* Booking Success Message */}
          {bookData && bookData.success && bookedFlight && (
            <div className="rounded-xl p-4 flex items-start gap-4" style={{ background: "color-mix(in srgb, var(--c-green) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--c-green) 20%, transparent)", color: "var(--c-green)" }}>
              <div className="rounded-full bg-green-500/20 p-2 text-green-600 dark:text-green-500">
                <Plane className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-green-700 dark:text-green-400">Flight Successfully Booked!</h3>
                <p className="mt-1 text-sm font-medium opacity-90 text-green-800 dark:text-green-300">
                  {bookData.message}
                </p>
                <div className="mt-3 inline-flex rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ background: "color-mix(in srgb, var(--c-green) 15%, transparent)" }}>
                  Ref: {bookData.booking_reference}
                </div>
              </div>
            </div>
          )}

          {bookError && (
             <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "color-mix(in srgb, var(--c-red) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--c-red) 20%, transparent)", color: "var(--c-red)" }}>
             <AlertTriangle className="h-5 w-5 shrink-0" />
             <div>
               <h3 className="font-semibold">Booking Failed</h3>
               <p className="mt-1 text-[13px] opacity-90">{bookError.message}</p>
             </div>
           </div>
          )}
          
          {/* AI Summary */}
          <div className="rounded-2xl p-6" style={{ background: "color-mix(in srgb, var(--c-blue) 5%, transparent)", border: "1px solid color-mix(in srgb, var(--c-blue) 15%, transparent)" }}>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--c-text)" }}>
              {data.ai_summary}
            </p>
          </div>

          {/* Flights Grid */}
          {data.flights && data.flights.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>Recommended Flights</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {data.flights.map((flight: any, idx: number) => (
                  <div key={idx} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold tracking-tight text-[16px]">{flight.airline}</span>
                      <span className="rounded bg-black/5 px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--c-text-subtle)" }}>{flight.flight_number}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black">{flight.departure_time}</span>
                      </div>
                      <div className="flex flex-col items-center px-4">
                        <span className="text-[12px] font-medium" style={{ color: "var(--c-text-subtle)" }}>{flight.duration}</span>
                        <div className="my-1.5 h-[2px] w-full rounded-full" style={{ background: "var(--c-border)" }} />
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--c-text-subtle)" }}>{flight.stops === 0 ? "Direct" : `${flight.stops} Stop`}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-2xl font-black">{flight.arrival_time}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t pt-4" style={{ borderColor: "var(--c-border)" }}>
                      <span className="text-[13px] font-medium" style={{ color: "var(--c-text-muted)" }}>Economy Class</span>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold flex items-center gap-1 text-green-600 dark:text-green-500">
                          <Banknote className="h-5 w-5" />
                          ${flight.price}
                        </span>
                        <button
                          onClick={() => handleBookFlight(flight)}
                          disabled={isBooking && bookedFlight?.flight_number === flight.flight_number}
                          className="cursor-pointer rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                          style={{ background: "var(--c-purple)", color: "white" }}
                        >
                          {isBooking && bookedFlight?.flight_number === flight.flight_number ? "Booking..." : "Book Now"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hotels Grid */}
          {data.hotels && data.hotels.length > 0 && (
            <section className="pb-10">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                <h2 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>Recommended Hotels</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {data.hotels.map((hotel: any, idx: number) => (
                  <div key={idx} className="flex flex-col justify-between rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                    <div>
                      <div className="mb-1 flex items-start justify-between">
                        <h3 className="text-[17px] font-bold leading-tight" style={{ color: "var(--c-text)" }}>{hotel.name}</h3>
                        <div className="flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-0.5 text-yellow-600 dark:text-yellow-400">
                          <span className="font-bold text-[13px]">{hotel.rating}</span>
                        </div>
                      </div>
                      <div className="mb-4 flex items-center gap-1">
                        {Array.from({ length: hotel.stars }).map((_, i) => (
                          <svg key={i} className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {hotel.amenities.map((amenity: string, i: number) => (
                          <span key={i} className="rounded-md px-2 py-1 text-[11px] font-medium" style={{ background: "var(--c-background)", color: "var(--c-text-muted)" }}>
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 text-right border-t pt-4" style={{ borderColor: "var(--c-border)" }}>
                      <span className="text-[12px] uppercase font-bold tracking-wider" style={{ color: "var(--c-text-subtle)" }}>Per Night</span>
                      <div className="text-2xl font-bold flex items-center justify-end gap-1 text-green-600 dark:text-green-500">
                        ${hotel.price_per_night}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
