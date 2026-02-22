import fs from "fs";
import path from "path";

// Auto-load .env.local if ELEVENLABS_API_KEY not already in env
if (!process.env.ELEVENLABS_API_KEY) {
  try {
    const envFile = fs.readFileSync(
      path.join(__dirname, "..", ".env.local"),
      "utf-8",
    );
    for (const line of envFile.split("\n")) {
      const eqIdx = line.indexOf("=");
      if (eqIdx > 0) {
        const key = line.slice(0, eqIdx).trim();
        const val = line.slice(eqIdx + 1).trim();
        if (key) process.env[key] = val;
      }
    }
  } catch {
    /* no .env.local — key must be passed in env */
  }
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.error("Error: ELEVENLABS_API_KEY not set. Add it to .env.local");
  process.exit(1);
}

const STAFF_VOICE_ID = "9BWtsMINqrJLrRacOk9x"; // Aria (premade)
const CUSTOMER_VOICE_ID = "IKne3meq5aSn9XLyUdCD"; // Charlie (premade)

interface ManifestEntry {
  audio_key: string;
  ja: string;
}
interface Manifest {
  staff: ManifestEntry[];
  customer: ManifestEntry[];
}

const manifest: Manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "audio-manifest.json"), "utf-8"),
);

async function generateAudio(text: string, voiceId: string, outPath: string) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

async function run() {
  const outDir = path.join(__dirname, "..", "public", "audio", "ja");
  fs.mkdirSync(outDir, { recursive: true });

  const items = [
    ...manifest.staff.map((item) => ({ ...item, voiceId: STAFF_VOICE_ID })),
    ...manifest.customer.map((item) => ({
      ...item,
      voiceId: CUSTOMER_VOICE_ID,
    })),
  ];

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    const outPath = path.join(outDir, `${item.audio_key}.mp3`);
    if (fs.existsSync(outPath)) {
      process.stdout.write(`skip  ${item.audio_key}\n`);
      skipped++;
      continue;
    }
    try {
      await generateAudio(item.ja, item.voiceId, outPath);
      process.stdout.write(`✓  ${item.audio_key}\n`);
      generated++;
      await new Promise((r) => setTimeout(r, 500)); // rate-limit buffer
    } catch (err) {
      process.stdout.write(`✗  ${item.audio_key}: ${err}\n`);
      failed++;
    }
  }

  console.log(
    `\nDone — generated: ${generated}  skipped: ${skipped}  failed: ${failed}`,
  );
}

run();
