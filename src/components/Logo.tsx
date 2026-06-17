import Image from "next/image";

const SIZES = {
  small:   { w: 124, h: 70 },
  default: { w: 176, h: 99 },
  large:   { w: 248, h: 139 },
} as const;

export default function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const { w, h } = SIZES[size];
  return (
    <Image
      src="/logo.png"
      alt="ERPIDE"
      width={w}
      height={h}
      priority={size !== "small"}
      className="block select-none"
      sizes={`${w}px`}
    />
  );
}
