import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Save } from "lucide-react";
import { GlassCard, PageHeader, WorkspaceNote, btnPrimary, inputClass, EmptyState } from "../components/ui";
import { appendAudit, type ContentBlock, wsGet, wsSet } from "../lib/workspace";

const AREAS = ["homepage", "pricing", "faq", "email", "website", "app"] as const;

const DEFAULTS: ContentBlock[] = [
  { id: "c1", area: "homepage", key: "hero_title", value: "SnapSell — AI product photos", updatedAt: Date.now() },
  { id: "c2", area: "homepage", key: "hero_subtitle", value: "Transform product photos in seconds", updatedAt: Date.now() },
  { id: "c3", area: "pricing", key: "pricing_subtitle", value: "Choose the plan that fits your needs", updatedAt: Date.now() },
  { id: "c4", area: "faq", key: "faq_intro", value: "Frequently asked questions", updatedAt: Date.now() },
  { id: "c5", area: "email", key: "welcome_subject", value: "Welcome to SnapSell", updatedAt: Date.now() },
  { id: "c6", area: "website", key: "footer_tagline", value: "AI-powered marketplace photos", updatedAt: Date.now() },
  { id: "c7", area: "app", key: "onboarding_title", value: "Get started with SnapSell", updatedAt: Date.now() },
];

export function AdminContentPage() {
  const { section } = useParams();
  const area = (AREAS.includes(section as (typeof AREAS)[number]) ? section : undefined) as
    | (typeof AREAS)[number]
    | undefined;

  const [blocks, setBlocks] = useState<ContentBlock[]>(() => wsGet("content_blocks", DEFAULTS));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    wsSet("content_blocks", blocks);
  }, [blocks]);

  const visible = area ? blocks.filter((b) => b.area === area) : blocks;

  const update = (id: string, value: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, value, updatedAt: Date.now() } : b)));
    setSaved(false);
  };

  const save = () => {
    wsSet("content_blocks", blocks);
    appendAudit({ admin: "admin", action: "Content saved", target: area || "all", status: "success" });
    setSaved(true);
  };

  const title = area ? area.charAt(0).toUpperCase() + area.slice(1) : "Content Management";

  return (
    <div>
      <PageHeader
        title={title}
        subtitle="Edit website and app copy. Local workspace until CMS APIs exist."
        actions={
          <button type="button" className={btnPrimary()} onClick={save}>
            <Save className="w-4 h-4" />
            {saved ? "Saved" : "Save"}
          </button>
        }
      />
      <WorkspaceNote />
      {visible.length === 0 ? (
        <GlassCard>
          <EmptyState title="No content blocks" description="Add keys for this area." />
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {visible.map((b) => (
            <GlassCard key={b.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-xs font-mono text-[#FF5A5F]">{b.area}.{b.key}</p>
                <p className="text-[11px] text-white/30">{new Date(b.updatedAt).toLocaleString()}</p>
              </div>
              <textarea
                rows={3}
                value={b.value}
                onChange={(e) => update(b.id, e.target.value)}
                className={inputClass()}
              />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
