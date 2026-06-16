const constrainedEndpoint =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

function apiUrl(path) {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  return `${apiBase}${path}`;
}

export async function createGeminiLiveTranslator({
  targetLanguage = 'ko',
  onStatus = () => {},
  onTranscript = () => {},
  onAudioLevel = () => {},
  onError = () => {},
  onStats = () => {}
} = {}) {
  let outputContext = null;
  let inputContext = null;
  let closed = false;
  let socket = null;
  let stream = null;
  let source = null;
  let processor = null;
  let zeroGain = null;
  let nextPlaybackTime = 0;
  let setupReady = false;
  let pcmQueue = [];
  let preSpeechChunks = [];
  let streamPaused = false;
  let speechSeen = false;
  let lastVoiceAt = 0;
  let noiseFloor = 0.002;
  let lastStatsAt = 0;
  const maxPreSpeechChunks = 4;
  const silenceMs = 1100;
  const stats = {
    inputSampleRate: 0,
    inputState: '',
    micReady: false,
    setupReady: false,
    sentChunks: 0,
    sentSignals: 0,
    receivedMessages: 0,
    activity: '대기',
    activityTurns: 0,
    voiceThreshold: 0,
    voiceLevel: 0,
    streamPaused: false
  };

  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    throw new Error('마이크 번역은 HTTPS 주소에서만 사용할 수 있습니다.');
  }

  onStatus('Gemini 준비 중');
  const tokenResponse = await fetch(apiUrl(`/api/gemini/live-token?targetLanguage=${encodeURIComponent(targetLanguage)}`));
  if (!tokenResponse.ok) {
    const error = await tokenResponse.json().catch(() => ({}));
    throw new Error(error.error || 'Gemini Live Translate token request failed.');
  }
  const tokenPayload = await tokenResponse.json();
  let resolveSetupReady = () => {};
  let rejectSetupReady = () => {};
  const setupReadyPromise = new Promise((resolve, reject) => {
    resolveSetupReady = resolve;
    rejectSetupReady = reject;
  });
  socket = new WebSocket(`${constrainedEndpoint}?access_token=${encodeURIComponent(tokenPayload.token)}`);

  socket.onopen = async () => {
    onStatus('연결됨');
    socket.send(
      JSON.stringify({
        setup: {
          model: `models/${tokenPayload.model}`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          generationConfig: {
            responseModalities: ['AUDIO'],
            translationConfig: {
              targetLanguageCode: targetLanguage,
              echoTargetLanguage: true
            }
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              prefixPaddingMs: 200,
              silenceDurationMs: 800
            }
          }
        }
      })
    );
  };

  socket.onmessage = async (event) => {
    const message = JSON.parse(await readSocketData(event.data));
    stats.receivedMessages += 1;
    emitStats(true);
    if (message.setupComplete) {
      setupReady = true;
      stats.setupReady = true;
      onStatus('마이크 준비 중');
      emitStats(true);
      resolveSetupReady();
      return;
    }
    const content = message.serverContent;
    if (!content) return;
    if (content.inputTranscription?.text) {
      onTranscript({ type: 'input', text: content.inputTranscription.text, language: content.inputTranscription.languageCode });
    }
    if (content.outputTranscription?.text) {
      stats.activity = '응답 중';
      onStatus('번역 재생 중');
      onTranscript({ type: 'output', text: content.outputTranscription.text, language: content.outputTranscription.languageCode });
    }
    for (const part of content.modelTurn?.parts || []) {
      if (part.inlineData?.data) {
        stats.activity = '응답 중';
        onStatus('번역 재생 중');
        playPcm24(part.inlineData.data);
      }
    }
    if (content.turnComplete) {
      stats.activity = '대기';
      onStatus('번역 중 - 말해보세요');
    }
    emitStats(true);
  };

  socket.onerror = () => {
    onStatus('연결 오류');
    const error = new Error('Gemini Live Translate 연결 중 오류가 발생했습니다.');
    onError(error.message);
    if (!setupReady) rejectSetupReady(error);
  };

  socket.onclose = (event) => {
    closed = true;
    stop();
    if (event.code !== 1000 && event.reason) {
      onError(`Gemini 연결 종료: ${event.reason}`);
    }
    onStatus(event.code === 1000 ? '종료됨' : `종료됨 (${event.code})`);
    if (!setupReady) {
      rejectSetupReady(new Error(`Gemini 연결이 준비 전에 종료되었습니다. (${event.code})`));
    }
  };

  await setupReadyPromise;
  if (closed) {
    throw new Error('Gemini 연결이 종료되었습니다.');
  }
  await prepareMicrophone();

  async function prepareMicrophone() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('이 브라우저는 Web Audio를 지원하지 않습니다.');
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('이 브라우저는 마이크 입력을 지원하지 않습니다.');
    }

    onStatus('마이크 권한 요청');
    outputContext = new AudioContextClass();
    inputContext = new AudioContextClass();
    await Promise.all([resumeAudioContext(outputContext), resumeAudioContext(inputContext)]);

    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    if (closed) return;

    await resumeAudioContext(inputContext);
    stats.inputSampleRate = Math.round(inputContext.sampleRate);
    stats.inputState = inputContext.state;
    stats.micReady = true;
    emitStats(true);

    source = inputContext.createMediaStreamSource(stream);
    processor = inputContext.createScriptProcessor(4096, 1, 1);
    zeroGain = inputContext.createGain();
    zeroGain.gain.value = 0;

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const level = rootMeanSquare(input);
      stats.inputState = inputContext.state;
      stats.voiceLevel = level;
      onAudioLevel(level);
      emitStats();
      if (!setupReady || socket?.readyState !== WebSocket.OPEN) return;
      const now = performance.now();
      const hasVoice = detectVoice(level);
      const resampled = resampleTo16k(input, inputContext.sampleRate);
      const chunks = collectPcmChunks(floatToPcm16(resampled));
      handleRealtimeAudio(chunks, hasVoice, now);
    };

    source.connect(processor);
    processor.connect(zeroGain);
    zeroGain.connect(inputContext.destination);
    onStatus('번역 중 - 말해보세요');
  }

  function playPcm24(base64) {
    if (closed) return;
    const context = outputContext;
    if (!context || context.state === 'closed') return;
    if (context.state === 'suspended') {
      context.resume().catch(() => {});
    }
    const bytes = base64ToBytes(base64);
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const buffer = context.createBuffer(1, samples.length, 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      channel[i] = Math.max(-1, Math.min(1, samples[i] / 32768));
    }
    const node = context.createBufferSource();
    node.buffer = buffer;
    node.connect(context.destination);
    const startAt = Math.max(context.currentTime + 0.02, nextPlaybackTime);
    node.start(startAt);
    nextPlaybackTime = startAt + buffer.duration;
  }

  function collectPcmChunks(pcm) {
    for (let i = 0; i < pcm.length; i += 1) {
      pcmQueue.push(pcm[i]);
    }
    const chunks = [];
    while (pcmQueue.length >= 1600) {
      chunks.push(new Int16Array(pcmQueue.splice(0, 1600)));
    }
    return chunks;
  }

  function detectVoice(level) {
    const threshold = Math.max(0.0015, Math.min(0.018, Math.max(noiseFloor * 1.6, noiseFloor + 0.0018)));
    const hasVoice = level >= threshold;
    stats.voiceThreshold = threshold;
    if (!speechSeen && !hasVoice) {
      noiseFloor = noiseFloor * 0.95 + level * 0.05;
    }
    return hasVoice;
  }

  function handleRealtimeAudio(chunks, hasVoice, now) {
    if (hasVoice) {
      lastVoiceAt = now;
      if (!speechSeen) {
        beginSpeech();
      }
      if (streamPaused) {
        streamPaused = false;
        stats.streamPaused = false;
        flushPreSpeechChunks();
      }
    }

    for (const chunk of chunks) {
      if (streamPaused && !hasVoice) {
        rememberPreSpeechChunk(chunk);
      } else {
        sendPcmChunk(chunk);
      }
    }

    if (speechSeen && !hasVoice && !streamPaused && now - lastVoiceAt > silenceMs) {
      endSpeech();
    }
  }

  function rememberPreSpeechChunk(chunk) {
    preSpeechChunks.push(chunk);
    if (preSpeechChunks.length > maxPreSpeechChunks) {
      preSpeechChunks.shift();
    }
  }

  function flushPreSpeechChunks() {
    for (const chunk of preSpeechChunks) {
      sendPcmChunk(chunk);
    }
    preSpeechChunks = [];
  }

  function sendPcmChunk(chunk) {
    if (!setupReady || socket?.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        realtimeInput: {
          audio: {
            data: bytesToBase64(new Uint8Array(chunk.buffer)),
            mimeType: 'audio/pcm;rate=16000'
          }
        }
      })
    );
    stats.sentChunks += 1;
    emitStats();
  }

  function beginSpeech() {
    if (speechSeen) return;
    speechSeen = true;
    stats.activity = '말 감지';
    stats.activityTurns += 1;
    onStatus('음성 감지');
    emitStats(true);
  }

  function endSpeech() {
    if (!speechSeen) return;
    sendAudioStreamEnd();
    speechSeen = false;
    streamPaused = true;
    stats.streamPaused = true;
    stats.activity = '응답 대기';
    onStatus('번역 처리 중');
    emitStats(true);
  }

  function sendAudioStreamEnd() {
    if (!setupReady || socket?.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        realtimeInput: {
          audioStreamEnd: true
        }
      })
    );
    stats.sentSignals += 1;
  }

  async function resumeAudioContext(context) {
    if (!context || context.state !== 'suspended') return;
    await context.resume().catch(() => {});
  }

  function emitStats(force = false) {
    const now = Date.now();
    if (!force && now - lastStatsAt < 300) return;
    lastStatsAt = now;
    onStats({ ...stats });
  }

  function stop() {
    processor?.disconnect();
    source?.disconnect();
    zeroGain?.disconnect();
    inputContext?.close().catch(() => {});
    outputContext?.close().catch(() => {});
    stream?.getTracks().forEach((track) => track.stop());
    processor = null;
    source = null;
    zeroGain = null;
    stream = null;
    inputContext = null;
    outputContext = null;
    pcmQueue = [];
    preSpeechChunks = [];
    streamPaused = false;
    speechSeen = false;
  }

  return {
    close() {
      closed = true;
      stop();
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    }
  };
}

function floatToPcm16(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}

function rootMeanSquare(samples) {
  let total = 0;
  for (let i = 0; i < samples.length; i += 1) total += samples[i] * samples[i];
  return Math.sqrt(total / samples.length);
}

function resampleTo16k(input, sourceRate) {
  if (!sourceRate || Math.abs(sourceRate - 16000) < 100) return input;
  const ratio = sourceRate / 16000;
  const length = Math.max(1, Math.floor(input.length / ratio));
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const position = i * ratio;
    const before = Math.floor(position);
    const after = Math.min(input.length - 1, before + 1);
    const weight = position - before;
    output[i] = input[before] * (1 - weight) + input[after] * weight;
  }
  return output;
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function readSocketData(data) {
  if (typeof data === 'string') return data;
  if (data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  return String(data);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
