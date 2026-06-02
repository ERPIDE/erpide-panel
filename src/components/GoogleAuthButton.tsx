"use client";

export default function GoogleAuthButton({ label }: { label?: string }) {
  return (
    <a
      href="/api/shop/auth/oauth/google"
      className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-[#1f1f24] hover:bg-[#26262d] border border-white/10 hover:border-white/20 text-gray-100 font-medium transition text-sm"
    >
      <GoogleIcon />
      {label || "Google ile devam et"}
    </a>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2a10.34 10.34 0 0 0-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.566 2.684-3.874 2.684-6.614z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.71H.957v2.332A9 9 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.712a5.41 5.41 0 0 1 0-3.424V4.956H.957a9 9 0 0 0 0 8.088l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.322 0 2.508.454 3.44 1.346l2.58-2.58C13.464.892 11.426 0 9 0A9 9 0 0 0 .957 4.956L3.964 7.29C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
