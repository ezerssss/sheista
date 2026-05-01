"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Copy, Share2, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShareCard } from "@/components/share/ShareCard";
import {
  FORMAT_DIMENSIONS,
  type ShareCardData,
  type ShareFormat,
  type ShareTemplate,
} from "@/components/share/types";
import {
  copyImageToClipboard,
  downloadBlob,
  exportNodeToBlob,
  nativeShareImage,
} from "@/lib/share/export-image";

type ActionStatus =
  | { kind: "idle" }
  | { kind: "loading"; action: "download" | "copy" | "share" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function ShareDialog({
  open,
  onOpenChange,
  template,
  onTemplateChange,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: ShareTemplate;
  onTemplateChange: (t: ShareTemplate) => void;
  data: ShareCardData;
}) {
  const [format, setFormat] = useState<ShareFormat>("story");
  const [status, setStatus] = useState<ActionStatus>({ kind: "idle" });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setStatus({ kind: "idle" });
  }, [open]);

  const dims = FORMAT_DIMENSIONS[format];
  // Preview width based on format aspect — cap reasonably for desktop dialogs.
  const previewSize = useMemo(() => {
    const maxW = 320;
    const maxH = 460;
    let w = maxW;
    let h = (w * dims.h) / dims.w;
    if (h > maxH) {
      h = maxH;
      w = (h * dims.w) / dims.h;
    }
    return { w, h };
  }, [dims]);
  const scale = previewSize.w / dims.w;

  const filename = `sheista-${template}-${data.cfHandle}.png`;

  const capture = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      return await exportNodeToBlob(cardRef.current, {
        width: dims.w,
        height: dims.h,
      });
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
      return null;
    }
  };

  const onDownload = async () => {
    setStatus({ kind: "loading", action: "download" });
    const blob = await capture();
    if (!blob) return;
    downloadBlob(blob, filename);
    setStatus({ kind: "success", message: "downloaded" });
  };

  const onCopy = async () => {
    setStatus({ kind: "loading", action: "copy" });
    const blob = await capture();
    if (!blob) return;
    const ok = await copyImageToClipboard(blob);
    setStatus(
      ok
        ? { kind: "success", message: "copied to clipboard" }
        : { kind: "error", message: "clipboard not supported — use download" },
    );
  };

  const onShare = async () => {
    setStatus({ kind: "loading", action: "share" });
    const blob = await capture();
    if (!blob) return;
    const ok = await nativeShareImage(
      blob,
      filename,
      `my sheista ${template} progress`,
    );
    if (!ok) {
      // Fall back to download on platforms without Web Share API.
      downloadBlob(blob, filename);
      setStatus({
        kind: "success",
        message: "share unavailable — downloaded instead",
      });
    } else {
      setStatus({ kind: "success", message: "shared" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>share your progress</DialogTitle>
          <DialogDescription>
            export a PNG sized for stories, posts, or wide cards
          </DialogDescription>
        </DialogHeader>

        {/* Off-screen full-size card used as html-to-image source */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <ShareCard
            ref={cardRef}
            template={template}
            format={format}
            data={data}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={template}
            onValueChange={(v) => onTemplateChange(v as ShareTemplate)}
          >
            <TabsList>
              <TabsTrigger value="daily">daily</TabsTrigger>
              <TabsTrigger value="streak">streak</TabsTrigger>
              <TabsTrigger value="level">level up</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={format} onValueChange={(v) => setFormat(v as ShareFormat)}>
            <TabsList>
              <TabsTrigger value="story">story 9:16</TabsTrigger>
              <TabsTrigger value="square">square 1:1</TabsTrigger>
              <TabsTrigger value="wide">wide 16:9</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="flex justify-center rounded-md border border-border bg-muted/40 p-4">
          <div
            className="overflow-hidden rounded-md border border-border"
            style={{ width: previewSize.w, height: previewSize.h }}
          >
            <div
              style={{
                width: dims.w,
                height: dims.h,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <ShareCard template={template} format={format} data={data} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {status.kind === "success" && (
              <span className="inline-flex items-center gap-1 text-accent">
                <Check className="h-3 w-3" /> {status.message}
              </span>
            )}
            {status.kind === "error" && (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3 w-3" /> {status.message}
              </span>
            )}
            {status.kind === "loading" && <span>working…</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              disabled={status.kind === "loading"}
            >
              <Copy className="h-3.5 w-3.5" /> copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              disabled={status.kind === "loading"}
            >
              <Share2 className="h-3.5 w-3.5" /> share…
            </Button>
            <Button
              size="sm"
              onClick={onDownload}
              disabled={status.kind === "loading"}
            >
              <Download className="h-3.5 w-3.5" /> download PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
