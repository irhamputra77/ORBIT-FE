"use client";

import { useMemo } from "react";
import type { EESOperator } from "../types";
import { resolveEESTemplate } from "../services/template-registry";

export function useEESTemplate(operator: EESOperator, fleet: string) {
  return useMemo(
    () => resolveEESTemplate(operator, fleet),
    [fleet, operator],
  );
}
