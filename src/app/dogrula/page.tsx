import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getServerTranslations } from "@/lib/i18n-server";
import VerifyClient from "./VerifyClient";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

// IMPORTANT: This page intentionally does NOT consume the verification token
// during server rendering. Mail security scanners (Gmail, Outlook, Microsoft
// Defender, Proofpoint, etc.) prefetch every link in a message to render
// previews and screen for phishing. Any server-side token consumption here
// burns the token before the real user clicks — and the user then sees
// "invalid/used link".
//
// Instead, the token is POSTed from VerifyClient via useEffect on the
// browser. Mail scanners do NOT execute JavaScript, so they leave the token
// untouched.
export default async function DogrulaPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const { t } = await getServerTranslations();

  // Translations: precomputed map for the client component (it can't call t()).
  const tMap: Record<string, string> = {
    "verify.verifying_title": t("verify.verifying_title"),
    "verify.verifying_desc": t("verify.verifying_desc"),
    "verify.success_title": t("verify.success_title"),
    "verify.success_desc": t("verify.success_desc"),
    "verify.already_title": t("verify.already_title"),
    "verify.already_desc": t("verify.already_desc"),
    "verify.invalid_link_title": t("verify.invalid_link_title"),
    "verify.invalid_link_desc": t("verify.invalid_link_desc"),
    "verify.used_link_title": t("verify.used_link_title"),
    "verify.used_link_desc": t("verify.used_link_desc"),
    "verify.expired_link_title": t("verify.expired_link_title"),
    "verify.expired_link_desc": t("verify.expired_link_desc"),
    "verify.error_title": t("verify.error_title"),
    "verify.error_desc": t("verify.error_desc"),
    "verify.go_to_account": t("verify.go_to_account"),
    "verify.back_to_signin": t("verify.back_to_signin"),
    "verify.redirecting": t("verify.redirecting"),
    "auth.login_button": t("auth.login_button"),
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
        <VerifyClient token={token || ""} t={tMap} />
      </main>
      <Footer />
    </>
  );
}
