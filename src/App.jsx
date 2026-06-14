import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  Languages,
  ListChecks,
  Mic,
  PauseCircle,
  Repeat2,
  RotateCcw,
  Search,
  Target,
  Volume2,
  XCircle,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  analyzeSentence,
  chooseNextSentence,
  makeQuestion,
  normalizeAnswer,
  scoreAnswer,
  speakText,
  workflows
} from './lib/learning.js';
import { createGeminiLiveTranslator } from './lib/liveTranslate.js';

const progressKey = 'beginner-english-pattern-progress-v1';

function publicAsset(publicPath) {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = String(publicPath || '').replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

function apiUrl(path) {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  return `${apiBase}${path}`;
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(progressKey) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(progressKey, JSON.stringify(progress));
}

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [workflow, setWorkflow] = useState('understand');
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    fetch(publicAsset('data/materials.json'))
      .then((response) => {
        if (!response.ok) throw new Error('materials.json not found');
        return response.json();
      })
      .then(setManifest)
      .catch((error) => setLoadError(error.message));
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const steps = manifest?.steps || [];
  const selectedStep = steps[stepIndex] || null;
  const sentences = selectedStep?.sentences || [];
  const sentence = sentences[sentenceIndex] || sentences[0] || null;
  const analysis = useMemo(() => analyzeSentence(sentence, selectedStep), [sentence, selectedStep]);
  const metrics = useMemo(() => buildMetrics(progress, sentences), [progress, sentences]);

  useEffect(() => {
    setSentenceIndex(0);
    setSpreadIndex(0);
    setWorkflow('understand');
  }, [stepIndex]);

  function patchSentenceProgress(sentenceId, patch) {
    if (!sentenceId) return;
    setProgress((current) => {
      const before = current[sentenceId] || { reps: 0, makes: 0, speaks: 0, answers: 0, bestScore: 0 };
      const after = typeof patch === 'function' ? patch(before) : { ...before, ...patch };
      return { ...current, [sentenceId]: after };
    });
  }

  function goNextSentence() {
    setSentenceIndex((current) => chooseNextSentence(sentences, progress, current));
  }

  if (loadError) {
    return (
      <main className="empty-state">
        <BookOpen size={42} />
        <h1>자료 인덱스가 없습니다</h1>
        <p>프로젝트 폴더에서 <code>npm run materials</code>를 실행하면 PDF 쌍을 병합하고 학습 데이터를 생성합니다.</p>
      </main>
    );
  }

  if (!manifest || !selectedStep) {
    return (
      <main className="empty-state">
        <BookOpen size={42} />
        <h1>자료를 읽는 중</h1>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="left-rail" aria-label="학습 스텝">
        <div className="brand-block">
          <div className="brand-mark"><BookOpen size={22} /></div>
          <div>
            <strong>Pattern Lab</strong>
            <span>Beginner English</span>
          </div>
        </div>

        <div className="step-stack">
          {steps.map((step, index) => (
            <button
              className={`step-button ${index === stepIndex ? 'active' : ''}`}
              key={step.id}
              onClick={() => setStepIndex(index)}
            >
              <span>{step.title}</span>
              <small>{step.sentences.length}문장 · {step.spreads.length}묶음</small>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>

        <div className="rail-meter">
          <div>
            <span>반복</span>
            <strong>{metrics.reps}</strong>
          </div>
          <div>
            <span>말하기</span>
            <strong>{metrics.speaks}</strong>
          </div>
          <div>
            <span>정확도</span>
            <strong>{Math.round(metrics.bestScore * 100)}%</strong>
          </div>
        </div>
      </aside>

      <main className="workbench">
        <header className="top-bar">
          <div>
            <span className="eyebrow">{selectedStep.topic}</span>
            <h1>{selectedStep.title}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" title="이전 문장" onClick={() => setSentenceIndex((value) => Math.max(0, value - 1))}>
              <ArrowLeft size={18} />
            </button>
            <button className="icon-button" title="다음 반복 문장" onClick={goNextSentence}>
              <ArrowRight size={18} />
            </button>
          </div>
        </header>

        <nav className="workflow-tabs" aria-label="학습 워크플로">
          {workflows.map((item, index) => (
            <button
              key={item.id}
              className={workflow === item.id ? 'active' : ''}
              onClick={() => setWorkflow(item.id)}
            >
              <span>{index + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <section className="workspace-grid">
          <div className="learning-pane">
            <WorkflowPane
              workflow={workflow}
              step={selectedStep}
              sentence={sentence}
              sentenceIndex={sentenceIndex}
              sentenceCount={sentences.length}
              analysis={analysis}
              onSelectSentence={setSentenceIndex}
              onNextSentence={goNextSentence}
              onProgress={patchSentenceProgress}
              progress={progress[sentence?.id] || {}}
            />
          </div>

          <aside className="reference-pane">
            <SourceSpread
              step={selectedStep}
              spreadIndex={spreadIndex}
              onSpreadIndex={setSpreadIndex}
            />
            <LiveTranslateDock sentence={sentence} />
          </aside>
        </section>
      </main>
    </div>
  );
}

function WorkflowPane({
  workflow,
  step,
  sentence,
  sentenceIndex,
  sentenceCount,
  analysis,
  onSelectSentence,
  onNextSentence,
  onProgress,
  progress
}) {
  if (!sentence) {
    return <Panel icon={<FileText size={20} />} title="문장 없음">OCR 후보 문장이 없습니다.</Panel>;
  }

  if (workflow === 'understand') {
    return <UnderstandPane step={step} sentence={sentence} analysis={analysis} />;
  }
  if (workflow === 'pattern') {
    return (
      <PatternPane
        sentence={sentence}
        sentenceIndex={sentenceIndex}
        sentenceCount={sentenceCount}
        analysis={analysis}
        onSelectSentence={onSelectSentence}
        onNextSentence={onNextSentence}
        onProgress={onProgress}
        progress={progress}
      />
    );
  }
  if (workflow === 'make') {
    return <MakePane sentence={sentence} analysis={analysis} onProgress={onProgress} onNextSentence={onNextSentence} />;
  }
  if (workflow === 'speak') {
    return <SpeakPane sentence={sentence} analysis={analysis} onProgress={onProgress} onNextSentence={onNextSentence} />;
  }
  return <AnswerPane step={step} sentence={sentence} sentenceIndex={sentenceIndex} analysis={analysis} onProgress={onProgress} onNextSentence={onNextSentence} />;
}

function UnderstandPane({ step, sentence, analysis }) {
  return (
    <div className="flow-stack">
      <Panel icon={<Search size={20} />} title="패턴 뼈대">
        <div className="pattern-grid">
          {step.patterns.map((pattern) => (
            <article className="pattern-card" key={pattern.name}>
              <strong>{pattern.name}</strong>
              <code>{pattern.formula}</code>
              <span>{pattern.focus}</span>
              <div className="mini-tags">
                {pattern.signals.map((signal) => <em key={signal}>{signal}</em>)}
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <SentenceFocus sentence={sentence} analysis={analysis} marker="오늘의 기준 문장" />
    </div>
  );
}

function PatternPane({ sentence, sentenceIndex, sentenceCount, analysis, onSelectSentence, onNextSentence, onProgress, progress }) {
  return (
    <div className="flow-stack">
      <SentenceFocus sentence={sentence} analysis={analysis} marker={`반복 ${progress.reps || 0}회`} />
      <Panel icon={<Repeat2 size={20} />} title="패턴 루프">
        <div className="drill-strip">
          <button className="icon-button" title="이전 문장" onClick={() => onSelectSentence(Math.max(0, sentenceIndex - 1))}>
            <ArrowLeft size={18} />
          </button>
          <input
            className="sentence-range"
            type="range"
            min="0"
            max={Math.max(0, sentenceCount - 1)}
            value={sentenceIndex}
            onChange={(event) => onSelectSentence(Number(event.target.value))}
            aria-label="문장 선택"
          />
          <button className="icon-button" title="다음 문장" onClick={() => onSelectSentence(Math.min(sentenceCount - 1, sentenceIndex + 1))}>
            <ArrowRight size={18} />
          </button>
          <button
            className="primary-button"
            onClick={() => {
              speakText(sentence.text);
              onProgress(sentence.id, (before) => ({ ...before, reps: (before.reps || 0) + 1 }));
            }}
          >
            <Volume2 size={18} />
            듣고 반복
          </button>
          <button className="secondary-button" onClick={onNextSentence}>
            <Target size={18} />
            약한 문장
          </button>
        </div>
      </Panel>
    </div>
  );
}

function MakePane({ sentence, analysis, onProgress, onNextSentence }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setInput('');
    setResult(null);
  }, [sentence.id]);

  function check() {
    const next = scoreAnswer(sentence.text, input);
    setResult(next);
    onProgress(sentence.id, (before) => ({
      ...before,
      makes: (before.makes || 0) + 1,
      bestScore: Math.max(before.bestScore || 0, next.score)
    }));
  }

  return (
    <div className="flow-stack">
      <Panel icon={<ListChecks size={20} />} title="문장 만들기">
        <div className="prompt-box">
          <span>한국어 프롬프트</span>
          <strong>{sentence.promptKo || '원본 자료의 영어 문장을 보고 같은 패턴으로 다시 만든다.'}</strong>
          <div className="mini-tags">
            {(sentence.hints || []).map((hint) => <em key={hint}>{hint}</em>)}
          </div>
        </div>
        <textarea
          className="answer-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="English sentence"
          rows={4}
        />
        <div className="button-row">
          <button className="primary-button" onClick={check}>
            <CheckCircle2 size={18} />
            확인
          </button>
          <button className="secondary-button" onClick={() => setInput(sentence.text)}>
            <Search size={18} />
            정답 보기
          </button>
          <button className="icon-button" title="입력 지우기" onClick={() => setInput('')}>
            <RotateCcw size={18} />
          </button>
        </div>
        {result && <ScoreResult result={result} expected={sentence.text} />}
      </Panel>
      <SentenceFocus sentence={sentence} analysis={analysis} marker="정답 구조" compact />
      <button className="wide-next" onClick={onNextSentence}>다음 반복 문장</button>
    </div>
  );
}

function SpeakPane({ sentence, analysis, onProgress, onNextSentence }) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setTranscript('');
    setResult(null);
    stopRecognition(recognitionRef);
  }, [sentence.id]);

  function start() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setTranscript('Speech Recognition is not available in this browser.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((item) => item[0]?.transcript || '')
        .join(' ')
        .trim();
      setTranscript(text);
      const next = scoreAnswer(sentence.text, text);
      setResult(next);
      if (event.results[event.results.length - 1]?.isFinal) {
        onProgress(sentence.id, (before) => ({
          ...before,
          speaks: (before.speaks || 0) + 1,
          bestScore: Math.max(before.bestScore || 0, next.score)
        }));
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return (
    <div className="flow-stack">
      <Panel icon={<Mic size={20} />} title="소리내어 말하기">
        <div className="speak-target">
          <button className="icon-button large" title="원어민 속도 듣기" onClick={() => speakText(sentence.text)}>
            <Volume2 size={22} />
          </button>
          <p>{sentence.text}</p>
        </div>
        <div className="button-row">
          <button className="primary-button" onClick={listening ? () => stopRecognition(recognitionRef) : start}>
            {listening ? <PauseCircle size={18} /> : <Mic size={18} />}
            {listening ? '멈춤' : '녹음'}
          </button>
          <button className="secondary-button" onClick={onNextSentence}>
            <Target size={18} />
            다음 문장
          </button>
        </div>
        <div className="transcript-box">
          <span>Transcript</span>
          <strong>{transcript || '...'}</strong>
        </div>
        {result && <ScoreResult result={result} expected={sentence.text} />}
      </Panel>
      <SentenceFocus sentence={sentence} analysis={analysis} marker="발음 전 체크" compact />
    </div>
  );
}

function AnswerPane({ step, sentence, sentenceIndex, analysis, onProgress, onNextSentence }) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const question = makeQuestion(sentence, step, sentenceIndex);

  useEffect(() => {
    setAnswer('');
    setResult(null);
  }, [sentence.id, question]);

  function check() {
    const next = scoreFreeAnswer(answer, step);
    setResult(next);
    onProgress(sentence.id, (before) => ({
      ...before,
      answers: (before.answers || 0) + 1,
      bestScore: Math.max(before.bestScore || 0, next.score)
    }));
  }

  return (
    <div className="flow-stack">
      <Panel icon={<Target size={20} />} title="질문에 대답하기">
        <div className="question-box">{question}</div>
        <textarea
          className="answer-input"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Answer in English"
          rows={4}
        />
        <div className="button-row">
          <button className="primary-button" onClick={check}>
            <CheckCircle2 size={18} />
            패턴 확인
          </button>
          <button className="secondary-button" onClick={() => speakText(question)}>
            <Volume2 size={18} />
            질문 듣기
          </button>
          <button className="secondary-button" onClick={onNextSentence}>
            <ArrowRight size={18} />
            다음 질문
          </button>
        </div>
        {result && (
          <div className={`result-box ${result.score >= 0.7 ? 'good' : 'needs-work'}`}>
            {result.score >= 0.7 ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{result.message}</span>
          </div>
        )}
      </Panel>
      <SentenceFocus sentence={sentence} analysis={analysis} marker="참고 패턴" compact />
    </div>
  );
}

function SentenceFocus({ sentence, analysis, marker, compact = false }) {
  return (
    <Panel icon={<BookOpen size={20} />} title={marker}>
      <div className={`sentence-focus ${compact ? 'compact' : ''}`}>
        <p>{sentence.text}</p>
        <div className="chunk-row">
          {analysis.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}
        </div>
        <div className="structure-row">
          {analysis.structures.map((part) => (
            <div key={`${part.label}-${part.value}`}>
              <span>{part.label}</span>
              <strong>{part.value}</strong>
            </div>
          ))}
        </div>
        <Glossary glossary={analysis.glossary} />
      </div>
    </Panel>
  );
}

function Glossary({ glossary }) {
  if (!glossary.length) {
    return <div className="glossary empty">핵심 표현 없음</div>;
  }
  return (
    <div className="glossary">
      {glossary.map((item) => (
        <span key={`${item.type}-${item.term}`}>
          <em>{item.type}</em>
          <strong>{item.term}</strong>
          {item.meaning}
        </span>
      ))}
    </div>
  );
}

function ScoreResult({ result, expected }) {
  const good = result.score >= 0.82;
  return (
    <div className={`score-panel ${good ? 'good' : 'needs-work'}`}>
      <div>
        {good ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        <strong>{Math.round(result.score * 100)}%</strong>
      </div>
      <p>{expected}</p>
      {result.missing.length > 0 && (
        <div className="mini-tags">
          {result.missing.map((token) => <em key={token}>{token}</em>)}
        </div>
      )}
    </div>
  );
}

function SourceSpread({ step, spreadIndex, onSpreadIndex }) {
  const [zoom, setZoom] = useState(1);
  const spread = step.spreads[spreadIndex] || step.spreads[0];
  if (!spread) return null;

  return (
    <section className="source-viewer">
      <header>
        <div>
          <span>원본 병합</span>
          <strong>{spread.oddPageNumber}-{spread.evenPageNumber}p</strong>
        </div>
        <div className="viewer-actions">
          <button className="icon-button" title="이전 페이지 묶음" onClick={() => onSpreadIndex(Math.max(0, spreadIndex - 1))}>
            <ArrowLeft size={16} />
          </button>
          <button className="icon-button" title="다음 페이지 묶음" onClick={() => onSpreadIndex(Math.min(step.spreads.length - 1, spreadIndex + 1))}>
            <ArrowRight size={16} />
          </button>
          <button className="icon-button" title="축소" onClick={() => setZoom((value) => Math.max(0.72, value - 0.1))}>
            <ZoomOut size={16} />
          </button>
          <button className="icon-button" title="확대" onClick={() => setZoom((value) => Math.min(1.35, value + 0.1))}>
            <ZoomIn size={16} />
          </button>
        </div>
      </header>
      <div className="spread-pages" style={{ '--page-zoom': zoom }}>
        <figure>
          <img src={publicAsset(spread.oddImage)} alt={`${step.title} odd page ${spread.oddPageNumber}`} />
          <figcaption>홀수 {spread.oddPageNumber}p</figcaption>
        </figure>
        <figure>
          <img src={publicAsset(spread.evenImage)} alt={`${step.title} even page ${spread.evenPageNumber}`} />
          <figcaption>짝수 {spread.evenPageNumber}p</figcaption>
        </figure>
      </div>
    </section>
  );
}

function LiveTranslateDock({ sentence }) {
  const [status, setStatus] = useState('확인 중');
  const [configured, setConfigured] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('ko');
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const translatorRef = useRef(null);

  useEffect(() => {
    fetch(apiUrl('/api/gemini/status'))
      .then((response) => response.json())
      .then((payload) => {
        setConfigured(Boolean(payload.configured));
        setStatus(payload.configured ? payload.model : 'API 키 없음');
      })
      .catch(() => setStatus('서버 대기'));
  }, []);

  useEffect(() => () => translatorRef.current?.close(), []);

  async function start() {
    setError('');
    setInputTranscript('');
    setOutputTranscript('');
    translatorRef.current?.close();
    try {
      translatorRef.current = await createGeminiLiveTranslator({
        targetLanguage,
        onStatus: setStatus,
        onAudioLevel: setLevel,
        onTranscript: ({ type, text }) => {
          if (type === 'input') setInputTranscript(text);
          if (type === 'output') setOutputTranscript(text);
        }
      });
    } catch (nextError) {
      setError(nextError.message);
      setStatus('대체 모드');
    }
  }

  function stop() {
    translatorRef.current?.close();
    translatorRef.current = null;
    setStatus(configured ? '대기' : 'API 키 없음');
    setLevel(0);
  }

  return (
    <section className="live-dock">
      <header>
        <div>
          <span>Gemini Live 3.5</span>
          <strong>Speech Translate</strong>
        </div>
        <Languages size={20} />
      </header>
      <div className="dock-controls">
        <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} aria-label="번역 언어">
          <option value="ko">Korean</option>
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="es">Spanish</option>
        </select>
        <button className="primary-button compact" onClick={start} disabled={!configured}>
          <Mic size={16} />
          시작
        </button>
        <button className="icon-button" title="Live Translate 종료" onClick={stop}>
          <PauseCircle size={16} />
        </button>
      </div>
      <div className="audio-meter"><span style={{ transform: `scaleX(${Math.min(1, level * 18)})` }} /></div>
      <div className="dock-status">
        <span>{status}</span>
        {sentence?.text && <button className="icon-button" title="현재 문장 듣기" onClick={() => speakText(sentence.text)}><Volume2 size={16} /></button>}
      </div>
      <div className="transcript-mini">
        <p>{inputTranscript || sentence?.text || '...'}</p>
        <strong>{outputTranscript || 'Live output transcript'}</strong>
      </div>
      {error && <div className="dock-error">{error}</div>}
    </section>
  );
}

function Panel({ icon, title, children }) {
  return (
    <section className="panel">
      <header>
        {icon}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function stopRecognition(ref) {
  try {
    ref.current?.stop();
  } catch {
    // Browser speech APIs can throw if stop is called after the session ended.
  }
}

function scoreFreeAnswer(answer, step) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return { score: 0, message: '답변을 입력한다.' };
  const hasSubject = /\b(i|you|we|they|he|she|it)\b/.test(normalized);
  if (step?.patternKind === 'progressive') {
    const hasBe = /\b(am|is|are|was|were|been)\b/.test(normalized);
    const hasIng = /\b[a-z]+ing\b/.test(normalized);
    const score = Number(hasSubject) * 0.25 + Number(hasBe) * 0.35 + Number(hasIng) * 0.4;
    return {
      score,
      message: score >= 0.7 ? '진행형 뼈대가 잡혔다.' : 'be 동사와 -ing 동사를 같이 넣는다.'
    };
  }
  const hasVerb = normalized.split(' ').length >= 3;
  const hasSignal = /\b(always|usually|often|sometimes|every|when|before|after|prefer)\b/.test(normalized);
  const score = Number(hasSubject) * 0.35 + Number(hasVerb) * 0.35 + Number(hasSignal) * 0.3;
  return {
    score,
    message: score >= 0.7 ? '현재 시제 반복 패턴이 보인다.' : '주어, 동사, 반복 신호를 더 분명히 넣는다.'
  };
}

function buildMetrics(progress, sentences) {
  if (!sentences.length) return { reps: 0, speaks: 0, bestScore: 0 };
  let reps = 0;
  let speaks = 0;
  let bestScore = 0;
  for (const sentence of sentences) {
    const item = progress[sentence.id] || {};
    reps += item.reps || 0;
    speaks += item.speaks || 0;
    bestScore += item.bestScore || 0;
  }
  return { reps, speaks, bestScore: bestScore / sentences.length };
}
