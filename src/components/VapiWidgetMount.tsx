"use client";
/**
 * Client wrapper for SupportWidget — voice (Vapi) + text chat (Anthropic).
 * Keeps both clients off the SSR path by lazy importing.
 */
import dynamic from "next/dynamic";

const SupportWidget = dynamic(() => import("./SupportWidget"), { ssr: false });

export default function VapiWidgetMount() {
  return <SupportWidget />;
}
