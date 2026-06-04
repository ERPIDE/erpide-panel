"use client";
/**
 * Client wrapper for VapiWidget so root layout (server component) can mount
 * it without dragging @vapi-ai/web into SSR. next/dynamic ssr:false only
 * works inside client components on Next.js 16.
 */
import dynamic from "next/dynamic";

const VapiWidget = dynamic(() => import("./VapiWidget"), { ssr: false });

export default function VapiWidgetMount() {
  return <VapiWidget />;
}
