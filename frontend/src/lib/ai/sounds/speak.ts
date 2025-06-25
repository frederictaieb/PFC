// utils/speak.ts
export function speak(text: string, lang: string = 'en-US') {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Optionnel : changer la langue/voix
      // 'en-US' ou 'fr-FR'
      utterance.lang = lang; 
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis non supporté sur ce navigateur.');
    }
  }