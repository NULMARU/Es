const apiKeyStorageKey = 'elevenlabs-api-key-v1';
const voiceIdStorageKey = 'elevenlabs-voice-id-v1';
const elevenLabsModelId = 'eleven_turbo_v2_5';
const cacheLimit = 40;
const webSpeechChunkLength = 200;

export const premadeVoices = [
  { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: '여', accent: '미국' },
  { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', gender: '여', accent: '미국' },
  { voiceId: '9BWtsMINqrJLrRacOk9x', name: 'Aria', gender: '여', accent: '미국' },
  { voiceId: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', gender: '여', accent: '영국' },
  { voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', gender: '여', accent: '영국' },
  { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: '남', accent: '미국' },
  { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian', gender: '남', accent: '미국' },
  { voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: '남', accent: '영국' },
  { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', gender: '남', accent: '영국' },
  { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: '남', accent: '호주' }
];

export function getElevenLabsApiKey() {
  return localStorage.getItem(apiKeyStorageKey) || '';
}

export function setElevenLabsApiKey(value) {
  const trimmed = String(value || '').trim();
  if (trimmed) localStorage.setItem(apiKeyStorageKey, trimmed);
  else localStorage.removeItem(apiKeyStorageKey);
  voiceOptionsCache = null;
}

export function getElevenLabsVoiceId() {
  return localStorage.getItem(voiceIdStorageKey) || '';
}

export function setElevenLabsVoiceId(value) {
  if (value) localStorage.setItem(voiceIdStorageKey, value);
  else localStorage.removeItem(voiceIdStorageKey);
}

function httpErrorMessage(status) {
  if (status === 401 || status === 403) return 'API 키가 올바르지 않거나 권한이 없습니다';
  if (status === 402 || status === 429) return '크레딧/사용량 한도에 도달했습니다';
  return `요청이 실패했습니다 (HTTP ${status})`;
}

async function fetchAccountVoices(apiKey) {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey }
  });
  if (!response.ok) {
    const error = new Error(httpErrorMessage(response.status));
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  return (payload.voices || []).map((voice) => ({
    voiceId: voice.voice_id,
    name: voice.name || voice.voice_id,
    gender: voice.labels?.gender || '',
    accent: voice.labels?.accent || ''
  }));
}

let voiceOptionsCache = null;

// 계정 음성 목록을 불러오고, 실패하면 premade 목록으로 폴백한다.
// 저장된 voiceId가 목록에 없으면 첫 목소리로 자동 보정한다.
export async function loadVoiceOptions({ force = false } = {}) {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    voiceOptionsCache = null;
    return { voices: [], error: '' };
  }
  if (voiceOptionsCache && !force) return voiceOptionsCache;

  let voices = [];
  let error = '';
  try {
    voices = await fetchAccountVoices(apiKey);
    if (!voices.length) throw Object.assign(new Error('계정에 목소리가 없습니다'), { status: 0 });
  } catch (fetchError) {
    voices = premadeVoices;
    error = fetchError.status
      ? `계정 목록 로드 실패 (HTTP ${fetchError.status}). 키가 권한 제한 키라면 'Voices: Read' 권한을 켜 주세요. 대신 기본 제공 목소리를 표시합니다 — 모두 재생 가능합니다.`
      : '계정 목록 로드 실패. 대신 기본 제공 목소리를 표시합니다 — 모두 재생 가능합니다.';
  }

  const savedVoiceId = getElevenLabsVoiceId();
  if (!voices.some((voice) => voice.voiceId === savedVoiceId)) {
    setElevenLabsVoiceId(voices[0].voiceId);
  }

  voiceOptionsCache = { voices, error };
  return voiceOptionsCache;
}

// 인메모리 오디오 캐시: "voiceId|텍스트" -> Object URL (최근 40개, LRU)
const audioCache = new Map();

function cacheGet(key) {
  if (!audioCache.has(key)) return null;
  const url = audioCache.get(key);
  audioCache.delete(key);
  audioCache.set(key, url);
  return url;
}

function cachePut(key, url) {
  if (audioCache.has(key)) cacheDrop(key);
  audioCache.set(key, url);
  while (audioCache.size > cacheLimit) {
    const oldestKey = audioCache.keys().next().value;
    cacheDrop(oldestKey);
  }
}

function cacheDrop(key) {
  const url = audioCache.get(key);
  if (url) URL.revokeObjectURL(url);
  audioCache.delete(key);
}

// 재생 상태 머신: idle -> loading -> playing. key는 어느 버튼이 활성인지 구분한다.
let ttsState = { status: 'idle', key: '' };
const stateListeners = new Set();

export function getTtsState() {
  return ttsState;
}

export function subscribeTts(listener) {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

function setTtsState(next) {
  ttsState = next;
  stateListeners.forEach((listener) => listener(ttsState));
}

let sessionToken = 0;
let currentAudio = null;
let currentAbort = null;
let quotaAlerted = false;

export function stopSpeech() {
  sessionToken += 1;
  if (currentAbort) {
    currentAbort.abort();
    currentAbort = null;
  }
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (ttsState.status !== 'idle') setTtsState({ status: 'idle', key: '' });
}

// 텍스트를 재생한다. 완주하면 { completed: true }, 중단/교체되면 { completed: false }.
export async function playText(text, { rate = 1, playKey } = {}) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return { completed: false };

  stopSpeech();
  const token = sessionToken;
  const key = playKey ?? trimmed;
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return speakWithWebSpeech(trimmed, rate, token, key);

  const voiceId = getElevenLabsVoiceId() || premadeVoices[0].voiceId;
  const cacheKey = `${voiceId}|${trimmed}`;
  let url = cacheGet(cacheKey);

  if (!url) {
    setTtsState({ status: 'loading', key });
    try {
      const controller = new AbortController();
      currentAbort = controller;
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_64`,
        {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, model_id: elevenLabsModelId }),
          signal: controller.signal
        }
      );
      if (!response.ok) {
        const error = new Error(httpErrorMessage(response.status));
        error.status = response.status;
        throw error;
      }
      const blob = await response.blob();
      if (token !== sessionToken) return { completed: false };
      url = URL.createObjectURL(blob);
      cachePut(cacheKey, url);
    } catch (error) {
      currentAbort = null;
      if (error.name === 'AbortError' || token !== sessionToken) return { completed: false };
      notifyElevenLabsFailure(error);
      setTtsState({ status: 'idle', key: '' });
      return speakWithWebSpeech(trimmed, rate, token, key);
    }
    currentAbort = null;
  }

  if (token !== sessionToken) return { completed: false };
  return playObjectUrl(url, cacheKey, trimmed, rate, token, key);
}

function notifyElevenLabsFailure(error) {
  const isKeyOrQuota = [401, 402, 403, 429].includes(error.status);
  if (isKeyOrQuota && !quotaAlerted) {
    quotaAlerted = true;
    alert(`ElevenLabs 재생 실패: ${error.message}. 내장 음성으로 대신 재생합니다.`);
    return;
  }
  console.warn('[tts] ElevenLabs 호출 실패, 내장 음성으로 폴백:', error.message);
}

function playObjectUrl(url, cacheKey, text, rate, token, key) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.playbackRate = rate;
    currentAudio = audio;
    setTtsState({ status: 'playing', key });
    audio.onended = () => {
      if (token === sessionToken) {
        currentAudio = null;
        setTtsState({ status: 'idle', key: '' });
      }
      resolve({ completed: true });
    };
    audio.onerror = () => {
      // 손상된 캐시 항목이 반복 실패를 일으키지 않도록 제거한다.
      cacheDrop(cacheKey);
      if (token !== sessionToken) {
        resolve({ completed: false });
        return;
      }
      currentAudio = null;
      resolve(speakWithWebSpeech(text, rate, token, key));
    };
    audio.play().catch(() => {
      if (token === sessionToken) {
        currentAudio = null;
        setTtsState({ status: 'idle', key: '' });
      }
      resolve({ completed: false });
    });
  });
}

let cachedWebVoice = null;

function pickWebSpeechVoice() {
  if (cachedWebVoice) return cachedWebVoice;
  const voices = window.speechSynthesis.getVoices().filter((voice) => (voice.lang || '').startsWith('en'));
  if (!voices.length) return null;
  const priorities = [/google/i, /natural|neural/i, /premium|enhanced|siri/i];
  for (const pattern of priorities) {
    const found = voices.find((voice) => pattern.test(voice.name));
    if (found) {
      cachedWebVoice = found;
      return found;
    }
  }
  cachedWebVoice = voices[0];
  return cachedWebVoice;
}

// Android Chrome은 긴 발화가 끊기므로 200자 안팎의 문장/절 단위로 나눈다.
function splitForWebSpeech(text) {
  const sentences = String(text).split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks = [];
  for (const sentence of sentences) {
    if (sentence.length <= webSpeechChunkLength) {
      chunks.push(sentence);
      continue;
    }
    let rest = sentence;
    while (rest.length > webSpeechChunkLength) {
      const slice = rest.slice(0, webSpeechChunkLength);
      const breakAt = Math.max(slice.lastIndexOf(', '), slice.lastIndexOf(' '));
      const cut = breakAt > 40 ? breakAt + 1 : webSpeechChunkLength;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
  }
  return chunks.length ? chunks : [text];
}

function speakWithWebSpeech(text, rate, token, key) {
  if (!('speechSynthesis' in window)) {
    setTtsState({ status: 'idle', key: '' });
    return Promise.resolve({ completed: false });
  }
  window.speechSynthesis.cancel();
  const chunks = splitForWebSpeech(text);
  setTtsState({ status: 'playing', key });

  return new Promise((resolve) => {
    const speakChunk = (index) => {
      if (token !== sessionToken) {
        resolve({ completed: false });
        return;
      }
      if (index >= chunks.length) {
        setTtsState({ status: 'idle', key: '' });
        resolve({ completed: true });
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1;
      const voice = pickWebSpeechVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = () => {
        if (token === sessionToken) setTtsState({ status: 'idle', key: '' });
        resolve({ completed: false });
      };
      window.speechSynthesis.speak(utterance);
    };
    speakChunk(0);
  });
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedWebVoice = null;
  });
}
