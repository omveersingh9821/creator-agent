/**
 * ImageGenerationPage — AI-powered image generation UI.
 *
 * Allows users to enter a text prompt and generate images using
 * DALL-E or Google Imagen. Shows loading state, the generated image,
 * and provides download/copy functionality.
 */

import { useState } from "react";
import { ImagePlus, Download, AlertTriangle, Sparkles, Wand2 } from "lucide-react";
import { useGenerateImage } from "../hooks/useGenerateImage";
import { CopyButton } from "../components/content/CopyButton";

export function ImageGenerationPage() {
  const { mutate, data, isPending, error, reset } = useGenerateImage();
  const [prompt, setPrompt] = useState("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isPending) return;
    mutate(prompt.trim());
  };

  const handleDownload = () => {
    if (!data?.image_base64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${data.image_base64}`;
    link.download = `ai-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10 lg:px-10">
      {/* Header */}
      <header className="text-center">
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium"
          style={{
            background: "color-mix(in srgb, var(--c-purple) 12%, transparent)",
            color: "var(--c-purple)",
            border: "1px solid color-mix(in srgb, var(--c-purple) 30%, transparent)",
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Image Generation
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
          style={{ color: "var(--c-text)" }}
        >
          Create with AI
        </h1>
        <p
          className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed sm:text-[15px]"
          style={{ color: "var(--c-text-muted)" }}
        >
          Describe your vision and let AI generate stunning images in seconds.
          Powered by DALL·E 3 & Google Imagen.
        </p>
      </header>

      {/* Prompt Input */}
      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <div
          className="relative rounded-xl transition-all duration-200"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
          }}
        >
          <div className="flex items-start gap-3 p-3">
            <ImagePlus
              className="mt-1 h-5 w-5 shrink-0"
              style={{ color: "var(--c-purple)" }}
            />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create... e.g. 'A futuristic city skyline at sunset with flying cars and neon lights'"
              rows={3}
              className="flex-1 resize-none bg-transparent text-[14px] leading-relaxed outline-none placeholder:opacity-50"
              style={{ color: "var(--c-text)" }}
              disabled={isPending}
            />
          </div>
          <div
            className="flex items-center justify-between rounded-b-xl px-4 py-2.5"
            style={{
              background: "var(--c-overlay)",
              borderTop: "1px solid var(--c-border)",
            }}
          >
            <span
              className="text-[11px] font-medium"
              style={{ color: "var(--c-text-subtle)" }}
            >
              {prompt.length > 0 ? `${prompt.length} characters` : "Min 3 characters"}
            </span>
            <button
              type="submit"
              disabled={prompt.trim().length < 3 || isPending}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, var(--c-purple), var(--c-blue))",
                boxShadow: "0 2px 8px color-mix(in srgb, var(--c-purple) 40%, transparent)",
              }}
            >
              <Wand2 className="h-3.5 w-3.5" />
              {isPending ? "Generating..." : "Generate Image"}
            </button>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-lg p-4 text-[13px]"
          style={{
            background: "color-mix(in srgb, var(--c-red) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--c-red) 30%, transparent)",
            color: "var(--c-red)",
          }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Image generation failed</p>
            <p className="mt-0.5 opacity-80">{error.message}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isPending && (
        <div
          className="flex flex-col items-center gap-4 rounded-xl p-8"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
          }}
        >
          <div className="relative h-16 w-16">
            <div
              className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--c-border)", borderTopColor: "var(--c-purple)" }}
            />
            <Wand2
              className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2"
              style={{ color: "var(--c-purple)" }}
            />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold" style={{ color: "var(--c-text)" }}>
              Creating your image...
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--c-text-muted)" }}>
              This may take 10–30 seconds
            </p>
          </div>
          {/* Skeleton shimmer */}
          <div
            className="h-[300px] w-full max-w-md animate-pulse rounded-lg"
            style={{ background: "var(--c-overlay)" }}
          />
        </div>
      )}

      {/* Generated Image */}
      {data && !isPending && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--c-text-subtle)" }}
            >
              Generated Image
            </h2>
            <button
              onClick={() => { reset(); setPrompt(""); }}
              className="text-[12px] font-medium transition-colors"
              style={{ color: "var(--c-purple)" }}
            >
              + New Image
            </button>
          </div>

          <div
            className="overflow-hidden rounded-xl"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
            }}
          >
            {/* Image */}
            <div className="group relative flex items-center justify-center p-4" style={{ background: "var(--c-overlay)" }}>
              <img
                src={`data:image/png;base64,${data.image_base64}`}
                alt={data.prompt}
                className="max-h-[512px] w-auto rounded-lg shadow-lg"
                style={{ maxWidth: "100%" }}
              />
              {/* Overlay Download Button */}
              <button
                onClick={handleDownload}
                className="absolute bottom-6 right-6 flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(135deg, var(--c-green), color-mix(in srgb, var(--c-green) 70%, black))",
                }}
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>

            {/* Actions bar */}
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderTop: "1px solid var(--c-border)" }}
            >
              <p
                className="flex-1 truncate text-[12px]"
                style={{ color: "var(--c-text-muted)" }}
                title={data.prompt}
              >
                <span className="font-medium" style={{ color: "var(--c-text-subtle)" }}>Prompt:</span>{" "}
                {data.prompt}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <CopyButton text={data.prompt} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!data && !isPending && !error && (
        <div
          className="flex flex-col items-center gap-3 rounded-xl py-16"
          style={{
            background: "var(--c-surface)",
            border: "1px dashed var(--c-border)",
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background: "color-mix(in srgb, var(--c-purple) 10%, transparent)",
            }}
          >
            <ImagePlus className="h-7 w-7" style={{ color: "var(--c-purple)" }} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: "var(--c-text)" }}>
            No images generated yet
          </p>
          <p className="max-w-xs text-center text-[12px]" style={{ color: "var(--c-text-muted)" }}>
            Enter a detailed prompt above and click "Generate Image" to create your first AI artwork.
          </p>
        </div>
      )}
    </div>
  );
}
