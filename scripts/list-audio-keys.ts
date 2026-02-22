import fs from 'fs';
import path from 'path';

interface DialogueNode {
  id: string;
  speaker: 'staff' | 'customer';
  ja: string;
  romaji: string;
  audio_key: string;
  options?: string[];
  next?: string | null;
  cultural_note?: string;
  en: string;
}

interface Scenario {
  id: string;
  nodes: Record<string, DialogueNode>;
}

interface ManifestEntry {
  audio_key: string;
  ja: string;
  romaji: string;
}

const scenariosDir = path.join(__dirname, '..', 'src', 'data', 'scenarios');
const outPath = path.join(__dirname, 'audio-manifest.json');

const files = fs
  .readdirSync(scenariosDir)
  .filter((f) => f.endsWith('.json'));

const staffMap = new Map<string, ManifestEntry>();
const customerMap = new Map<string, ManifestEntry>();

for (const file of files) {
  const raw = fs.readFileSync(path.join(scenariosDir, file), 'utf-8');
  const scenario: Scenario = JSON.parse(raw);

  for (const node of Object.values(scenario.nodes)) {
    const entry: ManifestEntry = {
      audio_key: node.audio_key,
      ja: node.ja,
      romaji: node.romaji,
    };
    if (node.speaker === 'staff') {
      staffMap.set(node.audio_key, entry);
    } else {
      customerMap.set(node.audio_key, entry);
    }
  }
}

const staff = Array.from(staffMap.values());
const customer = Array.from(customerMap.values());

const manifest = {
  generated_at: new Date().toISOString(),
  total: staff.length + customer.length,
  staff,
  customer,
};

fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`✓ audio-manifest.json written`);
console.log(`  staff:    ${staff.length} lines`);
console.log(`  customer: ${customer.length} lines`);
console.log(`  total:    ${manifest.total}`);
