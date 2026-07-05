"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/share/ShareDialog";
import type { ShareCardData, ShareTemplate } from "@/components/share/types";

export function ShareButton({
  cfHandle,
  cfRating,
  level,
  streakCurrent,
  streakLongest,
  todayDone,
  akRate,
  totalRounds,
  heatmap,
  todayKey,
}: {
  cfHandle: string;
  cfRating: number | null;
  level: number;
  streakCurrent: number;
  streakLongest: number;
  todayDone: boolean;
  akRate: number;
  totalRounds: number;
  heatmap: { date: string; count: number }[];
  todayKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<ShareTemplate>("daily");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const share = searchParams.get("share");
    if (share === "daily" || share === "streak" || share === "level") {
      setTemplate(share);
      setOpen(true);
      // Strip the share param from URL so a refresh doesn't keep re-opening.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("share");
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    }
  }, [searchParams, router]);

  const data: ShareCardData = {
    cfHandle,
    cfRating,
    level,
    streakCurrent,
    streakLongest,
    todayDone,
    akRate,
    totalRounds,
    heatmap,
    todayKey,
  };

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" />
        share
      </Button>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        template={template}
        onTemplateChange={setTemplate}
        data={data}
      />
    </>
  );
}
