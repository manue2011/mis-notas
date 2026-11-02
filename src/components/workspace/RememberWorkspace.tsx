"use client";

import { useEffect } from "react";
import { rememberWorkspaceAction } from "@/lib/workspace/actions";

/** Marks this workspace as the last one opened, so "/" returns to it. */
export function RememberWorkspace({ organizationId }: { organizationId: string }) {
  useEffect(() => {
    void rememberWorkspaceAction(organizationId);
  }, [organizationId]);
  return null;
}
