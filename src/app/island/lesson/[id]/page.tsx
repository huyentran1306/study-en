"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LessonPlayer, type LessonMode } from "@/components/island/lesson-player";

function Inner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const m = sp.get("mode");
  const mode: LessonMode = m === "listen" || m === "speak" ? m : "lesson";
  return <LessonPlayer key={`${id}-${mode}`} id={id} mode={mode} />;
}

export default function LessonPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
