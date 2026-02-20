"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    // Fire and forget to the tracking API
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {
      // Intentionally ignoring errors here so as not to spam the console
      // if the tracker is blocked by adblockers etc.
    });
  }, [pathname]);

  return null; // Silent component
}
