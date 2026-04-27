"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackMetaEvent } from "@/lib/metaPixel";

function MetaPixelPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackMetaEvent("PageView");
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixelEvents() {
  return (
    <Suspense fallback={null}>
      <MetaPixelPageViewTracker />
    </Suspense>
  );
}
