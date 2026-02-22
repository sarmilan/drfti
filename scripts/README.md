# drfti scripts

## audio:manifest

Generates `scripts/audio-manifest.json` — the full list of audio keys needed for ElevenLabs batch generation.

```bash
npm run audio:manifest
```

**When to run:** Any time you add a new scenario JSON file. The manifest is a build artifact (gitignored) and needs to be regenerated before running the audio generation script.

### Output format

```json
{
  "generated_at": "2024-01-01T00:00:00.000Z",
  "total": 84,
  "staff": [
    { "audio_key": "staff_irasshaimase", "ja": "いらっしゃいませ〜！", "romaji": "Irasshaimase~!" }
  ],
  "customer": [
    { "audio_key": "customer_sumimasen", "ja": "すみません。", "romaji": "Sumimasen." }
  ]
}
```

Staff and customer lines are separated so you can assign different ElevenLabs voices to each.

### audio_key naming convention

`{speaker}_{description_in_snake_case}`

Examples:
- `staff_irasshaimase` — staff saying いらっしゃいませ
- `customer_hitotsu_kudasai` — customer saying ひとつください

Each `audio_key` maps to a file at `public/audio/{lang}/{audio_key}.mp3`.

## generate-audio (Sprint 2, manual)

See Step 3 in the Sprint 2 doc. Creates mp3s from the manifest using the ElevenLabs API.
