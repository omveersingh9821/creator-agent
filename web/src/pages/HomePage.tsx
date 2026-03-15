/**
 * HomePage — fully responsive dashboard with Navbar + Sidebar + page-based routing.
 *
 * Sidebar nav items control which page is displayed in the main area:
 *   - Workspace (default): topic input + generated content
 *   - Usage: API stats dashboard (fetched from MongoDB)
 *   - Prompts: recommended prompt library
 *   - Recent Requests: generation history list (fetched from MongoDB)
 */

import { useState } from "react";
import { Zap, AlertTriangle } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Sidebar, type PageId } from "../components/Sidebar";
import { TopicInput } from "../components/TopicInput";
import { Loader } from "../components/ui/Loader";
import { StatsBar } from "../components/ui/StatsBar";
import { Footer } from "../components/ui/Footer";
import { CaptionCard } from "../components/content/CaptionCard";
import { HashtagCard } from "../components/content/HashtagCard";
import { ReelScriptCard } from "../components/content/ReelScriptCard";
import { ImageIdeaCard } from "../components/content/ImageIdeaCard";
import { BlogCard } from "../components/content/BlogCard";
import { UsagePage } from "./UsagePage";
import { PromptsPage } from "./PromptsPage";
import { RecentRequestsPage } from "./RecentRequestsPage";
import { useGenerateContent } from "../hooks/useGenerateContent";
import { useAuth } from "../auth/AuthContext";

export function HomePage() {
  const { mutate, data, isPending, error } = useGenerateContent();
  const { user } = useAuth();
  const [topicOverride, setTopicOverride] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<PageId>("workspace");

  const handleGenerate = (topic: string) => {
    mutate({
      topic,
      uid: user?.uid,
      email: user?.email ?? undefined,
      display_name: user?.displayName ?? undefined,
    });
  };

  const handleSelectPrompt = (prompt: string) => {
    setTopicOverride(prompt);
    setActivePage("workspace"); // Navigate back to workspace when a prompt is clicked
  };

  const handleSelectTopic = (topic: string) => {
    setTopicOverride(topic);
    setActivePage("workspace");
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden" style={{ background: "var(--c-canvas)" }}>
      {/* ── Navbar ── */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
      />

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* ── Main Content Area ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">

            {/* ════ WORKSPACE PAGE ════ */}
            {activePage === "workspace" && (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10 lg:px-10">
                {/* Header */}
                <header className="text-center">
                  <div
                    className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium"
                    style={{ background: "color-mix(in srgb, var(--c-green) 12%, transparent)", color: "var(--c-green)", border: "1px solid color-mix(in srgb, var(--c-green) 30%, transparent)" }}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    AI-Powered Content Engine
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ color: "var(--c-text)" }}>
                    PostPilot AI
                  </h1>
                  <p className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed sm:text-[15px]" style={{ color: "var(--c-text-muted)" }}>
                    Enter a topic and let the AI agent generate captions, hashtags, reel scripts, image ideas, and blog posts.
                  </p>
                </header>

                {/* Stats */}
                <StatsBar hasContent={!!data && !isPending} />

                {/* Input */}
                <TopicInput
                  onSubmit={handleGenerate}
                  isLoading={isPending}
                  externalTopic={topicOverride}
                  onExternalTopicConsumed={() => setTopicOverride("")}
                />

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 rounded-lg p-4 text-[13px]" style={{ background: "color-mix(in srgb, var(--c-red) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--c-red) 30%, transparent)", color: "var(--c-red)" }}>
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Generation failed</p>
                      <p className="mt-0.5 opacity-80">{error.message}</p>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {isPending && <Loader />}

                {/* Results */}
                {data && !isPending && (
                  <section className="flex flex-col gap-4 pb-8">
                    <h2 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-subtle)" }}>
                      Generated Content
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <CaptionCard caption={data.caption} />
                      <HashtagCard hashtags={data.hashtags} />
                      <ReelScriptCard script={data.reel_script} />
                      <ImageIdeaCard idea={data.image_idea} />
                    </div>
                    <BlogCard blog={data.blog} />
                  </section>
                )}
              </div>
            )}

            {/* ════ USAGE PAGE (live from MongoDB) ════ */}
            {activePage === "usage" && <UsagePage />}

            {/* ════ PROMPTS PAGE ════ */}
            {activePage === "prompts" && (
              <PromptsPage onSelectPrompt={handleSelectPrompt} />
            )}

            {/* ════ RECENT REQUESTS PAGE (live from MongoDB) ════ */}
            {activePage === "recent" && (
              <RecentRequestsPage onSelectTopic={handleSelectTopic} />
            )}

          </div>

          {/* Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
}

