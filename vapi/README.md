# Vapi Assistant Config (IaC)

Vapi.ai üzerinde canlıda çalışan AI asistanlarımızın config'i. **Git source of truth** — Vapi dashboard'dan elle değiştirme, buradan PATCH at.

## Asistanlar

| Slug | İsim | Assistant ID | Açıklama |
|---|---|---|---|
| `eylul` | Eylül | `2d3c095c-...` (env `VAPI_ASSISTANT_ID`) | erpide.com web widget + telefon (TR+RU) |

## Klasör yapısı

```
vapi/eylul/
├── config.json      ← editable: voice, transcriber, model, firstMessage, endCallPhrases
├── prompt.md        ← system prompt (markdown — kolay diff/edit)
└── .snapshot.json   ← son pull/push'tan ham Vapi response (audit/diff için, commit edilir)
```

`config.json` içindeki `model.messages[0].content === "@prompt.md"` marker'ı push sırasında `prompt.md` dosyasının içeriğiyle değişir.

## Workflow

### Vapi → Git (pull)
```bash
npm run vapi:pull
```
Dashboard'dan değişiklik gelmişse (örn. acil prompt fix), önce pull at, sonra commit.

### Git → Vapi (push)
```bash
npm run vapi:push           # gerçek PATCH
npm run vapi:push -- --dry  # PATCH atmadan payload göster
```

### Diff kontrolü
Push'tan önce `git diff vapi/` ile değişiklikleri gör. Snapshot dosyası push sonrası güncellenir.

## Ortak değişiklikler

### Model değiştirme (maliyet optimizasyonu)
`config.json` → `model.model` alanı:
- `gpt-4o` → mevcut, ~$0.07/dakika
- `gpt-4o-mini` → ~30x ucuz, kalite biraz düşer
- `claude-haiku-4-5` (provider: `anthropic`) → ~5x ucuz, kalite iyi
- `claude-sonnet-4-6` → gpt-4o'ya benzer maliyet, daha akıllı

### Prompt güncelleme
`prompt.md`'yi editle → `npm run vapi:push`. Tek dosya, kolay.

### Voice değiştirme
`config.json` → `voice` bloğu. **Şu an ElevenLabs** (Vapi'nin kendi anahtarıyla —
ayrı ElevenLabs hesabı yok, ücret Vapi faturasına dakika başı eklenir):

```json
"voice": { "provider": "11labs", "voiceId": "EXAVITQu4vr4xnSDxMaL",
           "model": "eleven_turbo_v2_5", "language": "tr", ... }
```

`voiceId` = ElevenLabs premade sesleri. Denenebilecek kadın sesleri:
`EXAVITQu4vr4xnSDxMaL` Sarah (mevcut, yumuşak/profesyonel) · `cgSgspJ2msm6clMCkdW9`
Jessica (daha canlı) · `XrExE9yKIg1WjnnlVkGX` Matilda (sıcak) · `Xb7hH8MSUJpSbSDYk0k2`
Alice (net/kurumsal) · `pFZP5JQG7iQjIQuC4Bku` Lily.

**Bedava Azure'a geri dönmek için** bu bloğu şununla değiştirip `npm run vapi:push`:
```json
"voice": { "provider": "azure", "voiceId": "tr-TR-EmelNeural" }
```
Azure yerli Türkçe telaffuz yapar ama tonlaması düz/robotik; ElevenLabs doğal
tonlar, karşılığında hafif aksan + dakika başı ücret. Azure listesi:
https://speech.microsoft.com/portal/voicegallery

**Transcriber keyword kuralı:** boşluklu terim YASAK (`"Data Engine:3"` → 400).
Tek kelime yaz (`"DataEngine:3"`).

### Transcriber keyword ekleme
`config.json` → `transcriber.keywords` array'ine `"WITMA:5"` gibi yeni terim ekle. Sayı = boost weight.

## Güvenlik

- `VAPI_PRIVATE_KEY` env değişkeni gerekli (Vercel dashboard'da var, lokal `.env.production.local`'dan otomatik okunur)
- `.snapshot.json` Vapi'nin döndüğü full response — secret içermez (`isServerUrlSecretSet: true` flag'i var sadece, gerçek secret döndürmez)
- Git'e push güvenli

## CI

Şimdilik manuel. İlerleyen aşamada GitHub Action ile `main`'e merge'te otomatik `vapi:push` tetiklenebilir — ama prod assistant olduğu için manuel kontrol daha güvenli.
