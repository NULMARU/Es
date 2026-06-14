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
  onAudioLevel = () => {}
} = {}) {
  onStatus('토큰 요청 중');
  const tokenResponse = await fetch(apiUrl(`/api/gemini/live-token?targetLanguage=${encodeURIComponent(targetLanguage)}`));
  if (!tokenResponse.ok) {
    const error = await tokenResponse.json().catch(() => ({}));
    throw new Error(error.error || 'Gemini Live Translate token request failed.');
  }
  const tokenPayload = await tokenResponse.json();
  const socket = new WebSocket(`${constrainedEndpoint}?access_token=${encodeURIComponent(tokenPayload.token)}`);

  let inputContext;
  let outputContext;
  let stream;
  let source;
  let processor;
  let nextPlaybackTime = 0;
  let started = false;

  socket.onopen = async () => {
    onStatus('연결됨');
    socket.send(
      JSON.stringify({
        setup: {
          model: `models/${tokenPayload.model}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            translationConfig: {
              targetLanguageCode: targetLanguage,
              echoTargetLanguage: true
            }
          }
        }
      })
    );
    await startMicrophone();
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const content = message.serverContent;
    if (!content) return;
    if (content.inputTranscription?.text) {
      onTranscript({ type: 'input', text: content.inputTranscription.text, language: content.inputTranscription.languageCode });
    }
    if (content.outputTranscription?.text) {
      onTranscript({ type: 'output', text: content.outputTranscription.text, language: content.outputTranscription.languageCode });
    }
    for (const part of content.modelTurn?.parts || []) {
      if (part.inlineData?.data) {
        playPcm24(part.inlineData.data);
      }
    }
  };

  socket.onerror = () => {
    onStatus('연결 오류');
  };

  socket.onclose = () => {
    stop();
    onStatus('종료됨');
  };

  async function startMicrophone() {
    if (started) return;
    started = true;
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    inputContext = new AudioContext({ sampleRate: 16000 });
    outputContext = new AudioContext();
    source = inputContext.createMediaStreamSource(stream);
    processor = inputContext.createScriptProcessor(2048, 1, 1);

    processor.onaudioprocess = (event) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      const input = event.inputBuffer.getChannelData(0);
      onAudioLevel(rootMeanSquare(input));
      const pcm = floatToPcm16(input);
      socket.send(
        JSON.stringify({
          realtimeInput: {
            audio: {
              data: bytesToBase64(new Uint8Array(pcm.buffer)),
              mimeType: 'audio/pcm;rate=16000'
            }
          }
        })
      );
    };

    source.connect(processor);
    processor.connect(inputContext.destination);
    onStatus('번역 중');
  }

  function playPcm24(base64) {
    if (!outputContext) return;
    const bytes = base64ToBytes(base64);
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const buffer = outputContext.createBuffer(1, samples.length, 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      channel[i] = Math.max(-1, Math.min(1, samples[i] / 32768));
    }
    const node = outputContext.createBufferSource();
    node.buffer = buffer;
    node.connect(outputContext.destination);
    const startAt = Math.max(outputContext.currentTime + 0.02, nextPlaybackTime);
    node.start(startAt);
    nextPlaybackTime = startAt + buffer.duration;
  }

  function stop() {
    processor?.disconnect();
    source?.disconnect();
    inputContext?.close().catch(() => {});
    stream?.getTracks().forEach((track) => track.stop());
    processor = null;
    source = null;
    stream = null;
    started = false;
  }

  return {
    close() {
      stop();
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
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

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
