export function getAudioPath(audio_key: string, language: 'ja' | 'fr'): string {
  return `/audio/${language}/${audio_key}.mp3`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function preloadAudio(_audio_key: string, _language: 'ja' | 'fr'): void {
  // Sprint 2: implement real preloading
}
