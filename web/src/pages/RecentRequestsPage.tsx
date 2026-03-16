/**
 * RecentRequestsPage — fetches LIVE recent requests from MongoDB via the API.
 */

import { useEffect, useState } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { fetchUserRequests, type UserRequest } from "../services/api";

interface RecentRequestsPageProps {
  onSelectTopic: (topic: string) => void;
}

export function RecentRequestsPage({ onSelectTopic }: RecentRequestsPageProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    fetchUserRequests(user.uid)
      .then((res) => setRequests(res.recent_requests ?? []))
      .catch((err) => console.error("Failed to fetch requests:", err))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>Recent Requests</h1>
          <p className="mt-1 text-[14px]" style={{ color: "var(--c-text-muted)" }}>Loading your requests...</p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--c-border-muted)", borderTopColor: "var(--c-green)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
          Recent Requests
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--c-text-muted)" }}>
          Your latest content generation requests. Click any item to re-use it.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <Clock className="h-4 w-4" style={{ color: "var(--c-text-subtle)" }} />
          <span className="text-[13px] font-semibold" style={{ color: "var(--c-text)" }}>All Requests</span>
          <span className="text-[12px]" style={{ color: "var(--c-text-subtle)" }}>({requests.length})</span>
        </div>

        {requests.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--c-text-subtle)" }}>
            No requests yet. Go to <strong>Workspace</strong> and generate some content.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border-muted)" }}>
            {requests.map((req, i) => (
              <button
                key={i}
                onClick={() => onSelectTopic(req.topic)}
                className="cursor-pointer flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-raised)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: "color-mix(in srgb, var(--c-blue) 15%, transparent)", color: "var(--c-blue)" }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 truncate" style={{ color: "var(--c-text-muted)" }}>
                  {req.topic}
                </span>
                <span className="text-[11px] shrink-0" style={{ color: "var(--c-text-subtle)" }}>
                  {new Date(req.timestamp).toLocaleDateString()}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-40" style={{ color: "var(--c-text-subtle)" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
