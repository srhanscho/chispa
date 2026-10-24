// Browser-only helpers around the Web Speech API (free, no key).

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  utterance.voice =
    voices.find((v) => v.lang === "es-CO") ??
    voices.find((v) => v.lang === "es-MX") ??
    voices.find((v) => v.lang.startsWith("es")) ??
    null;
  utterance.lang = utterance.voice?.lang ?? "es-CO";
  utterance.pitch = 1.2;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canListen = () => recognitionCtor() !== null;

export function listen(onText: (text: string) => void, onEnd: () => void) {
  const Ctor = recognitionCtor();
  if (!Ctor) return onEnd();
  const recognition = new Ctor();
  recognition.lang = "es-CO";
  recognition.interimResults = false;
  recognition.onresult = (event) => onText(event.results[0][0].transcript);
  recognition.onerror = onEnd;
  recognition.onend = onEnd;
  recognition.start();
}
