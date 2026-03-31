"use client";

export default function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const scale = size === "small" ? 0.6 : size === "large" ? 1.4 : 1;

  return (
    <div className="flex flex-col items-center" style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      {/* Crown */}
      <svg width="24" height="14" viewBox="0 0 24 14" fill="none" className="mb-0.5">
        <path d="M2 12L5 4L8.5 8L12 2L15.5 8L19 4L22 12" stroke="url(#crown-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="5" cy="3.5" r="1.2" fill="url(#crown-grad)" />
        <circle cx="12" cy="1.5" r="1.2" fill="url(#crown-grad)" />
        <circle cx="19" cy="3.5" r="1.2" fill="url(#crown-grad)" />
        <defs>
          <linearGradient id="crown-grad" x1="2" y1="0" x2="22" y2="12" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Horizontal line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-1" />
      {/* Text */}
      <div className="flex items-baseline gap-0 leading-none">
        <span className="text-[22px] font-serif font-bold tracking-[0.15em] text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          ERP
        </span>
        <span
          className="text-[16px] font-serif font-bold tracking-[0.12em] text-transparent bg-clip-text"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            backgroundImage: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginLeft: "-1px",
          }}
        >
          IDE
        </span>
      </div>
      {/* Bottom line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mt-1" />
      {/* Tagline */}
      <span className="text-[6px] tracking-[0.3em] text-gray-500 uppercase mt-1">
        ERP Çözümleri Hakkında Her Şey
      </span>
    </div>
  );
}
