"""
PocketERPIDE tanitim videosu (web MVP gezintisi).
Playwright record_video_dir ile 4 sekmeyi sirayla 5'er saniye gosterir.
Cikti: public/videos/pocketerpide-promo.webm (~25-30 sn)
"""
import asyncio
import json
import io
import sys
import shutil
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from playwright.async_api import async_playwright, Route

BASE_URL = "http://localhost:3000"
OUT_PATH = Path(r"C:\tmp\erpide-panel\public\videos\pocketerpide-promo.webm")
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
TMP_DIR = Path(r"C:\tmp\erpide-panel\scripts\.video-tmp")
TMP_DIR.mkdir(parents=True, exist_ok=True)

MOCK_ME = {
    "user": {"id": "ss-demo-user", "email": "demo@erpide.com", "name": "Demo", "surname": "Kullanici"},
    "apps": {"pocketerpide": True},
}

DEMO_DATA = {
    "salary": {"gross": 65000, "net": 48700, "payDay": 1},
    "txs": [
        {"id": "tx-1", "type": "income",  "amount": 48700, "category": "Maas",      "note": "Haziran maasi",       "date": "2026-06-01"},
        {"id": "tx-2", "type": "income",  "amount": 4500,  "category": "Ek Gelir",   "note": "Freelance proje",     "date": "2026-06-12"},
        {"id": "tx-3", "type": "expense", "amount": 12000, "category": "Kira",       "note": "Ev kirasi",           "date": "2026-06-03"},
        {"id": "tx-4", "type": "expense", "amount": 4200,  "category": "Market",     "note": "Migros haftalik",     "date": "2026-06-05"},
        {"id": "tx-5", "type": "expense", "amount": 1850,  "category": "Fatura",     "note": "Elektrik+su+dogalgaz","date": "2026-06-08"},
        {"id": "tx-6", "type": "expense", "amount": 2400,  "category": "Ulasim",     "note": "Akaryakit",           "date": "2026-06-10"},
        {"id": "tx-7", "type": "expense", "amount": 850,   "category": "Yemek",      "note": "Restoran",            "date": "2026-06-14"},
        {"id": "tx-8", "type": "expense", "amount": 3200,  "category": "Saglik",     "note": "Dis tedavisi",        "date": "2026-06-15"},
        {"id": "tx-9", "type": "expense", "amount": 1500,  "category": "Eglence",    "note": "Sinema + konser",     "date": "2026-06-18"},
    ],
    "goals": [{"target": 50000, "deadline": "2026-12-31", "title": "Tatil fonu"}],
    "cards": [
        {"id": "card-1", "name": "Garanti Bonus",       "last4": "4521", "limit": 35000, "statementDay": 5,  "dueDay": 25, "interestRate": 4.25, "color": "from-green-600 to-emerald-600"},
        {"id": "card-2", "name": "Yapikredi WorldCard", "last4": "8847", "limit": 25000, "statementDay": 18, "dueDay": 8,  "interestRate": 4.50, "color": "from-blue-600 to-cyan-600"},
    ],
    "statements": [
        {"id": "st-1", "cardId": "card-1", "period": "2026-05", "totalSpent": 18450, "minimumPayment": 1845, "totalDue": 18450, "paidAmount": 18450, "interestCharged": 0,   "paidDate": "2026-05-25"},
        {"id": "st-2", "cardId": "card-1", "period": "2026-06", "totalSpent": 9200,  "minimumPayment": 920,  "totalDue": 9200,  "paidAmount": 0,     "interestCharged": 0},
        {"id": "st-3", "cardId": "card-2", "period": "2026-05", "totalSpent": 7800,  "minimumPayment": 780,  "totalDue": 7800,  "paidAmount": 5000,  "interestCharged": 119, "paidDate": "2026-06-08"},
    ],
    "loans": [
        {"id": "loan-1", "name": "Konut Kredisi", "lender": "Garanti BBVA", "principal": 800000, "interestRate": 2.85, "monthlyPayment": 12450, "startDate": "2024-09-01", "termMonths": 120, "type": "konut"},
        {"id": "loan-2", "name": "Tasit Kredisi", "lender": "Yapikredi",    "principal": 250000, "interestRate": 3.45, "monthlyPayment": 6800,  "startDate": "2025-03-01", "termMonths": 48,  "type": "tasit"},
    ],
    "loanPayments": [
        {"id": "lp-1", "loanId": "loan-1", "period": "2026-06", "principalPart": 4200, "interestPart": 8250, "totalPaid": 12450, "paidDate": "2026-06-01"},
        {"id": "lp-2", "loanId": "loan-2", "period": "2026-06", "principalPart": 2150, "interestPart": 4650, "totalPaid": 6800,  "paidDate": "2026-06-01"},
    ],
    "bigItems": [
        {"id": "bi-1", "category": "vehicle",  "name": "Renault Megane 2024",  "purchasePrice": 1250000, "purchaseDate": "2025-03-15"},
        {"id": "bi-2", "category": "phone",    "name": "iPhone 16 Pro 256GB",  "purchasePrice": 75000,   "purchaseDate": "2025-10-20"},
        {"id": "bi-3", "category": "property", "name": "Aydin Efeler Daire",   "purchasePrice": 4500000, "purchaseDate": "2024-09-01"},
        {"id": "bi-4", "category": "phone",    "name": "iPhone 14 (eski)",     "purchasePrice": 45000,   "purchaseDate": "2023-11-10", "soldPrice": 28000, "soldDate": "2025-10-19"},
    ],
}

TABS = [
    ("Genel Bakış",   8),  # ana sayfa, biraz daha uzun dur
    ("Kredi Kartları", 6),
    ("Krediler",      6),
    ("Büyük Alımlar", 7),
]


async def handle_route(route: Route):
    if "/api/shop/auth/me" in route.request.url:
        await route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_ME))
    else:
        await route.continue_()


async def main():
    # Onceki tmp video temizle
    if TMP_DIR.exists():
        for f in TMP_DIR.glob("*.webm"):
            f.unlink()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(TMP_DIR),
            record_video_size={"width": 1920, "height": 1080},
        )

        await context.add_init_script(
            f"try {{ localStorage.setItem('pocket:v2', JSON.stringify({json.dumps(DEMO_DATA)})); }} catch(e){{}}"
        )
        await context.route("**/api/shop/auth/me*", handle_route)

        page = await context.new_page()

        print(f"Navigating to {BASE_URL}/pocket ...")
        await page.goto(f"{BASE_URL}/pocket", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(1500)

        # Genel zaten acik (default tab)
        for tab_name, dwell_sec in TABS:
            try:
                btn = page.get_by_role("button", name=tab_name)
                if await btn.count() > 0:
                    await btn.first.click()
                    print(f"-> {tab_name} (dwell {dwell_sec}s)")
                    await page.wait_for_timeout(800)  # framer-motion animasyon

                    # Yumusak scroll asagi/yukari — daha canli gozuksun
                    half = dwell_sec * 1000 // 2
                    await page.wait_for_timeout(half)
                    await page.evaluate("window.scrollBy({top: 400, behavior: 'smooth'})")
                    await page.wait_for_timeout(half)
                    await page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
                    await page.wait_for_timeout(500)
            except Exception as e:
                print(f"!!! {tab_name} failed: {e}")

        # Final 1 saniye bekle
        await page.wait_for_timeout(1000)
        await context.close()
        await browser.close()

    # Video dosyasini topla
    videos = list(TMP_DIR.glob("*.webm"))
    if not videos:
        print("!!! No video file produced")
        return
    video_file = max(videos, key=lambda f: f.stat().st_size)
    shutil.move(str(video_file), str(OUT_PATH))
    size_mb = OUT_PATH.stat().st_size / 1024 / 1024
    print(f"\nOK Video: {OUT_PATH} ({size_mb:.2f} MB)")

    # tmp temizle
    shutil.rmtree(TMP_DIR, ignore_errors=True)


if __name__ == "__main__":
    asyncio.run(main())
