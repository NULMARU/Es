import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileUp,
  FileText,
  Languages,
  Moon,
  ListChecks,
  Mic,
  PauseCircle,
  Repeat2,
  RefreshCw,
  RotateCcw,
  Search,
  Sun,
  Target,
  Volume2,
  XCircle
} from 'lucide-react';
import {
  analyzeSentence,
  chooseNextSentence,
  makeAnswerQuestions,
  normalizeAnswer,
  scoreAnswer,
  speakText,
  workflows
} from './lib/learning.js';
import { createGeminiLiveTranslator } from './lib/liveTranslate.js';

const progressKey = 'beginner-english-pattern-progress-v1';
const themeKey = 'beginner-english-pattern-theme-v1';

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

async function fetchMaterialsManifest() {
  try {
    const response = await fetch(apiUrl('/api/materials'), { cache: 'no-store' });
    if (response.ok) return response.json();
  } catch {
    // Static deployments do not have the local Express API.
  }
  const fallback = await fetch(publicAsset('data/materials.json'), { cache: 'no-store' });
  if (!fallback.ok) throw new Error('materials.json not found');
  return fallback.json();
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error(`${file.name} 파일을 읽을 수 없습니다.`));
    reader.readAsDataURL(file);
  });
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

function loadTheme() {
  return localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light';
}

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [workflow, setWorkflow] = useState('understand');
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [progress, setProgress] = useState(loadProgress);
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  const steps = manifest?.steps || [];
  const selectedStep = steps[stepIndex] || null;
  const sentences = selectedStep?.sentences || [];
  const sentence = sentences[sentenceIndex] || sentences[0] || null;
  const analysis = useMemo(() => analyzeSentence(sentence, selectedStep), [sentence, selectedStep]);

  useEffect(() => {
    setSentenceIndex(0);
    setWorkflow('understand');
  }, [stepIndex]);

  async function loadMaterials(selectStepNumber = null) {
    setLoadError('');
    try {
      const nextManifest = await fetchMaterialsManifest();
      setManifest(nextManifest);
      if (selectStepNumber) {
        const nextIndex = (nextManifest.steps || []).findIndex((step) => step.stepNumber === selectStepNumber);
        if (nextIndex >= 0) setStepIndex(nextIndex);
      }
      return nextManifest;
    } catch (error) {
      setLoadError(error.message);
      return null;
    }
  }

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
              <small>{step.sentences.length}문장</small>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>

        <LiveTranslateDock sentence={sentence} />
      </aside>

      <main className="workbench">
        <header className="top-bar">
          <div>
            <span className="eyebrow">{selectedStep.topic}</span>
            <h1>{selectedStep.title}</h1>
          </div>
          <div className="top-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
              title={theme === 'light' ? '다크 모드' : '화이트 모드'}
              aria-label={theme === 'light' ? '다크 모드로 변경' : '화이트 모드로 변경'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            <button className="icon-button" title="이전 문장" onClick={() => setSentenceIndex((value) => Math.max(0, value - 1))}>
              <ArrowLeft size={18} />
            </button>
            <button className="icon-button" title="약한 문장 이동" onClick={goNextSentence}>
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
            <SourceSentenceList
              step={selectedStep}
              sentenceIndex={sentenceIndex}
              onSelectSentence={setSentenceIndex}
              onMaterialsUpdated={loadMaterials}
            />
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
    return (
      <MakePane
        sentence={sentence}
        sentenceIndex={sentenceIndex}
        sentenceCount={sentenceCount}
        analysis={analysis}
        onSelectSentence={onSelectSentence}
        onProgress={onProgress}
      />
    );
  }
  if (workflow === 'speak') {
    return (
      <SpeakPane
        sentence={sentence}
        sentenceIndex={sentenceIndex}
        sentenceCount={sentenceCount}
        analysis={analysis}
        onSelectSentence={onSelectSentence}
        onProgress={onProgress}
      />
    );
  }
  return (
    <AnswerPane
      step={step}
      sentence={sentence}
      analysis={analysis}
      onProgress={onProgress}
    />
  );
}

function UnderstandPane({ step, sentence, analysis }) {
  return (
    <div className="flow-stack">
      <Panel icon={<Search size={20} />} title="패턴 뼈대">
        <div className="pattern-current-sentence">
          <span>영어 문장</span>
          <strong>{sentence.text}</strong>
        </div>
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

      <SentenceFocus sentence={sentence} analysis={analysis} marker="중급 단어" compact vocabularyOnly />
    </div>
  );
}

function PatternPane({ sentence, sentenceIndex, sentenceCount, analysis, onSelectSentence, onNextSentence, onProgress, progress }) {
  return (
    <div className="flow-stack">
      <Panel icon={<Repeat2 size={20} />} title="패턴 루프">
        <SentenceNavigator
          sentence={sentence}
          sentenceIndex={sentenceIndex}
          sentenceCount={sentenceCount}
          onSelectSentence={onSelectSentence}
        />
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
      <SentenceFocus sentence={sentence} analysis={analysis} marker="중급 단어" compact vocabularyOnly />
    </div>
  );
}

function MakePane({ sentence, sentenceIndex, sentenceCount, analysis, onSelectSentence, onProgress }) {
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
          <strong>{getKoreanPrompt(sentence)}</strong>
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
          <button className="secondary-button" onClick={() => onSelectSentence(Math.max(0, sentenceIndex - 1))} disabled={sentenceIndex <= 0}>
            <ArrowLeft size={18} />
            이전 문장
          </button>
          <button className="primary-button" onClick={check}>
            <CheckCircle2 size={18} />
            확인
          </button>
          <button className="secondary-button" onClick={() => onSelectSentence(Math.min(sentenceCount - 1, sentenceIndex + 1))} disabled={sentenceIndex >= sentenceCount - 1}>
            <ArrowRight size={18} />
            다음 문장
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
      <SentenceFocus sentence={sentence} analysis={analysis} marker="중급 단어" compact vocabularyOnly />
    </div>
  );
}

function SpeakPane({ sentence, sentenceIndex, sentenceCount, analysis, onSelectSentence, onProgress }) {
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
        <SentenceNavigator
          sentence={sentence}
          sentenceIndex={sentenceIndex}
          sentenceCount={sentenceCount}
          onSelectSentence={onSelectSentence}
        />
        <div className="button-row">
          <button className="primary-button" onClick={listening ? () => stopRecognition(recognitionRef) : start}>
            {listening ? <PauseCircle size={18} /> : <Mic size={18} />}
            {listening ? '멈춤' : '녹음'}
          </button>
          <button className="secondary-button" onClick={() => onSelectSentence(Math.min(sentenceCount - 1, sentenceIndex + 1))} disabled={sentenceIndex >= sentenceCount - 1}>
            <ArrowRight size={18} />
            다음 문장
          </button>
        </div>
        <div className="transcript-box">
          <span>Transcript</span>
          <strong>{transcript || '...'}</strong>
        </div>
        {result && <ScoreResult result={result} expected={sentence.text} />}
      </Panel>
      <SentenceFocus sentence={sentence} analysis={analysis} marker="중급 단어" compact vocabularyOnly />
    </div>
  );
}

function AnswerPane({ step, sentence, analysis, onProgress }) {
  const questions = useMemo(() => makeAnswerQuestions(step), [step]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const question = questions[questionIndex] || questions[0] || '';

  useEffect(() => {
    setQuestionIndex(0);
  }, [step.id]);

  useEffect(() => {
    setAnswer('');
    setResult(null);
  }, [step.id, questionIndex]);

  function check() {
    const next = scoreFreeAnswer(answer, step, question, questionIndex);
    setResult(next);
    onProgress(`${step.id}-answer-${questionIndex + 1}`, (before) => ({
      ...before,
      answers: (before.answers || 0) + 1,
      bestScore: Math.max(before.bestScore || 0, next.score)
    }));
  }

  return (
    <div className="flow-stack">
      <Panel icon={<Target size={20} />} title="질문에 대답하기">
        <div className="answer-question-card">
          <div className="sentence-nav-top">
            <span>{questionIndex + 1}/{questions.length}</span>
            <button className="icon-button" title="질문 듣기" onClick={() => speakText(question)}>
              <Volume2 size={18} />
            </button>
          </div>
          <div className="question-box">{question}</div>
          <div className="sentence-nav-controls">
            <button className="secondary-button compact" onClick={() => setQuestionIndex((value) => Math.max(0, value - 1))} disabled={questionIndex <= 0}>
              <ArrowLeft size={16} />
              이전
            </button>
            <button className="secondary-button compact" onClick={() => setQuestionIndex((value) => Math.min(questions.length - 1, value + 1))} disabled={questionIndex >= questions.length - 1}>
              <ArrowRight size={16} />
              다음
            </button>
          </div>
        </div>
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
            답변하기
          </button>
          <button className="secondary-button" onClick={() => speakText(question)}>
            <Volume2 size={18} />
            질문 듣기
          </button>
          <button className="secondary-button" onClick={() => setQuestionIndex((value) => Math.min(questions.length - 1, value + 1))} disabled={questionIndex >= questions.length - 1}>
            <ArrowRight size={18} />
            다음 질문
          </button>
        </div>
        {result && (
          <div className={`answer-feedback ${result.isCorrect ? 'good' : 'needs-work'}`}>
            <div className="feedback-heading">
              {result.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <strong>{result.isCorrect ? '정답' : '수정 필요'}</strong>
              <span>{Math.round(result.score * 100)}%</span>
            </div>
            <p>{result.message}</p>
            {result.issues.length > 0 && (
              <ul>
                {result.issues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            )}
            {!result.isCorrect && (
              <div className="correction-box">
                <span>추천 정답</span>
                <strong>{result.correction}</strong>
              </div>
            )}
          </div>
        )}
      </Panel>
      <SentenceFocus sentence={sentence} analysis={analysis} marker="중급 단어" compact vocabularyOnly />
    </div>
  );
}

function SentenceNavigator({ sentence, sentenceIndex, sentenceCount, onSelectSentence }) {
  const current = sentenceIndex + 1;
  const count = Math.max(1, sentenceCount);
  return (
    <div className="sentence-nav">
      <div className="sentence-nav-top">
        <span>{current}/{count}</span>
        <button className="icon-button" title="현재 문장 듣기" onClick={() => speakText(sentence.text)}>
          <Volume2 size={18} />
        </button>
      </div>
      <p>{sentence.text}</p>
      <div className="sentence-nav-controls">
        <button className="secondary-button compact" onClick={() => onSelectSentence(Math.max(0, sentenceIndex - 1))} disabled={sentenceIndex <= 0}>
          <ArrowLeft size={16} />
          이전
        </button>
        <button className="secondary-button compact" onClick={() => onSelectSentence(Math.min(sentenceCount - 1, sentenceIndex + 1))} disabled={sentenceIndex >= sentenceCount - 1}>
          <ArrowRight size={16} />
          다음
        </button>
      </div>
    </div>
  );
}

function SentenceFocus({ sentence, analysis, marker, compact = false, vocabularyOnly = false, sentenceVocabularyOnly = false }) {
  return (
    <Panel icon={<BookOpen size={20} />} title={marker}>
      <div className={`sentence-focus ${compact ? 'compact' : ''}`}>
        {vocabularyOnly ? (
          <IntermediateVocabulary sentence={sentence} glossary={analysis.glossary} />
        ) : sentenceVocabularyOnly ? (
          <>
            <p>{sentence.text}</p>
            <IntermediateVocabulary sentence={sentence} glossary={analysis.glossary} />
          </>
        ) : (
          <>
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
            <IntermediateVocabulary sentence={sentence} glossary={analysis.glossary} />
          </>
        )}
      </div>
    </Panel>
  );
}

function IntermediateVocabulary({ sentence, glossary }) {
  return (
    <div className="intermediate-vocabulary">
      <p className="translation-line">{getKoreanPrompt(sentence)}</p>
      <Glossary glossary={glossary} inline empty />
    </div>
  );
}

function Glossary({ glossary, inline = false, empty = false }) {
  if (!glossary.length) {
    return empty ? <div className={`glossary empty ${inline ? 'inline' : ''}`} aria-label="중급 단어 없음" /> : null;
  }
  return (
    <div className={`glossary ${inline ? 'inline' : ''}`}>
      {glossary.map((item) => (
        <span key={`${item.type}-${item.term}`}>
          <strong>{item.term}</strong>
          <em>{item.meaning}</em>
          {item.example && <small>{item.example}</small>}
        </span>
      ))}
    </div>
  );
}

const koreanPromptByEnglish = new Map([
  ['I stock up when Olive Young has a sale.', '올리브영이 세일하면 나는 몰아서 사.'],
  ["I always put on sunscreen, even when I don't wear makeup.", '화장을 하지 않는 날에도 나는 항상 선크림을 발라.'],
  ['I like that I can sleep late on weekends.', '주말에는 늦잠을 잘 수 있어서 나는 좋아.'],
  ['I always crave something sweet after lunch.', '점심을 먹고 나면 나는 항상 단것이 당겨.'],
  ['I seriously think about what to eat for lunch.', '나는 점심으로 무엇을 먹을지 매일 진지하게 고민해.'],
  ['I like going to restaurants people say are good.', '나는 사람들이 맛있다고 하는 식당에 가는 것을 좋아해.'],
  ['I wash my hands as soon as I get home.', '나는 집에 오자마자 손을 씻어.'],
  ['I check Instagram in bed before I fall asleep.', '나는 잠들기 전에 침대에 누워 인스타그램을 봐.'],
  ["I don't answer unknown numbers that seem like spam.", '나는 스팸처럼 보이는 모르는 번호는 받지 않아.'],
  ['I regret it when I eat too much.', '너무 많이 먹으면 나는 후회를 해.'],
  ['I buy what I want after I get paid.', '월급을 받으면 나는 사고 싶은 것을 사.'],
  ['I always try on clothes to check the size.', '나는 사이즈를 확인하려고 옷을 항상 입어 봐.'],
  ["I don't want to go out after I remove my makeup.", '화장을 지우고 나면 나는 밖에 나가기 싫어.'],
  ['When I find a nice café, I share it with my friends.', '좋은 카페를 찾으면 나는 친구들과 공유해.'],
  ['I take a lot of photos when I travel.', '여행을 가면 나는 사진을 많이 찍어.'],
  ["I order delivery when I don't want to cook.", '요리하기 싫을 때 나는 배달을 시켜.'],
  ["I know I can't sleep well if I drink coffee.", '커피를 마시면 잠을 잘 못 잔다는 것을 나는 알아.'],
  ["I often skip breakfast, even though I shouldn't.", '그러면 안 좋은데도 나는 아침을 자주 걸러.'],
  ["I have a license, but I'm scared of driving.", '나는 면허가 있지만 운전하는 것이 무서워.'],
  ['I drink beer while watching TV shows at home.', '나는 집에서 드라마를 보면서 맥주를 마셔.'],
  ['I feel nervous when my battery is low.', '배터리가 적어지면 나는 불안해.'],
  ['I try to do a sheet mask every night.', '나는 매일 밤 시트 마스크를 하려고 해.'],
  ['I take a taxi home after a work dinner.', '회식 후에는 나는 택시를 타고 집에 가.'],
  ["I get tired easily when it's crowded.", '사람이 많으면 나는 쉽게 피곤해져.'],
  ['I get stressed when my plans change.', '계획이 바뀌면 나는 스트레스를 받아.'],
  ['I order my cosmetics before they run out.', '화장품이 다 떨어지기 전에 나는 미리 주문해.'],
  ['I check reviews before I watch a movie.', '영화를 보기 전에 나는 후기를 확인해.'],
  ['I like buying pajamas that are comfortable and cute.', '나는 편하고 귀여운 잠옷을 사는 것을 좋아해.'],
  ['I change into comfy clothes when I get home.', '집에 오면 나는 편한 옷으로 갈아입어.'],
  ['I fall asleep easily when I read a book before bed.', '자기 전에 책을 읽으면 나는 쉽게 잠들어.'],
  ['I check my phone first when I wake up.', '일어나면 나는 휴대폰부터 확인해.'],
  ["I get grumpy when I'm hungry.", '배가 고프면 나는 예민해져.'],
  ["I don't go outside when it rains.", '비가 오면 나는 밖에 나가지 않아.'],
  ["I get impatient when things don't go as planned.", '일이 계획대로 되지 않으면 나는 조급해져.'],
  ['Sometimes, I fall asleep while watching Reels or something.', '가끔 나는 릴스 같은 것을 보다가 잠들어.'],
  ['I always wear a mask when the fine dust is really bad.', '미세먼지가 심하면 나는 항상 마스크를 써.'],
  ['I always stand by the door before I get off the subway.', '지하철에서 내리기 전에는 나는 항상 문 옆에 서 있어.'],
  ['I need a few minutes to clear my head after I wake up.', '잠에서 깨고 나면 나는 정신을 차릴 시간이 몇 분 필요해.'],
  ['I want some quiet time after a long day.', '긴 하루를 보내고 나면 나는 조용한 시간이 필요해.'],
  ["I can't focus when my room is messy.", '방이 지저분하면 나는 집중을 못 해.'],
  ['I sing along when my favorite song comes on.', '좋아하는 노래가 나오면 나는 따라 불러.'],
  ["I laugh a lot when I'm with my friends.", '친구들과 있으면 나는 많이 웃어.'],
  ['I stretch when my body feels stiff.', '몸이 뻐근하면 나는 스트레칭을 해.'],
  ['I open the window when my room feels stuffy.', '방이 답답하면 나는 창문을 열어.'],
  ['I try to reply to work emails as soon as I read them.', '업무 이메일을 읽자마자 나는 답장하려고 노력해.'],
  ['I always send birthday messages to my friends.', '친구들 생일에는 나는 항상 생일 메시지를 보내.'],
  ["I go straight to the doctor when I'm sick.", '아프면 나는 바로 병원에 가.'],
  ['I prefer taking a walk instead of exercising.', '나는 운동하는 것보다 산책하는 것을 더 좋아해.'],
  ['I listen to loud music when I exercise.', '운동할 때 나는 음악을 크게 들어.'],
  ['I turn off notifications when I do important work.', '중요한 일을 할 때 나는 알림을 꺼.'],
  ['Are you eating anything these days for your health?', '요즘 건강을 위해 먹고 있는 것이 있어?'],
  ['I couldn\'t answer the phone because I was taking a shower.', '샤워를 하고 있어서 나는 전화를 받을 수 없었어.'],
  ['Are you meeting anyone often these days?', '요즘 자주 만나고 있는 사람이 있어?'],
  ['I saw you earlier. Where were you heading?', '아까 너를 봤어. 어디로 가는 중이었어?'],
  ["They're gaming again, so they'll probably stay up late.", '그들은 또 게임을 하고 있어서 아마 늦게 잘 거야.'],
  ['You looked serious. Who were you talking to on the phone?', '너 심각해 보였어. 누구와 통화하고 있었어?'],
  ['I was getting ready for bed at 11 PM.', '나는 밤 11시에 잘 준비를 하고 있었어.'],
  ['Are you waiting for something now?', '지금 무엇을 기다리고 있어?'],
  ['I couldn\'t reply because I was driving.', '운전 중이어서 나는 답장을 할 수 없었어.'],
  ['Why are you laughing? Did you see something funny?', '왜 웃고 있어? 재미있는 것을 봤어?'],
  ["I'm not talking to him these days.", '나는 요즘 그와 이야기하지 않고 있어.'],
  ['He was studying for a test all night.', '그는 밤새 시험공부를 하고 있었어.'],
  ["He's practicing the guitar for a performance.", '그는 공연을 위해 기타를 연습하고 있어.'],
  ["I'm rethinking it after hearing what you said.", '네 말을 듣고 나서 나는 그것을 다시 생각하고 있어.'],
  ['Everyone was doing [their own thing] at that time.', '그때 모두가 각자 자기 일을 하고 있었어.'],
  ["Give me a second. I'm gathering my thoughts.", '잠깐만. 나는 지금 생각을 정리하고 있어.'],
  ['I was wondering what you were thinking.', '나는 네가 무슨 생각을 하고 있는지 궁금했어.'],
  ['Look outside. The sun is setting.', '밖을 봐. 해가 지고 있어.'],
  ["I'm thinking about what to do.", '나는 무엇을 할지 생각하고 있어.'],
  ['lt was hard to drive because it was snowing really hard.', '눈이 정말 많이 오고 있어서 운전하기가 힘들었어.'],
  ['It was hard to drive because it was snowing really hard.', '눈이 정말 많이 오고 있어서 운전하기가 힘들었어.'],
  ['My phone battery died when I was having an important conversation.', '중요한 대화를 하고 있을 때 내 휴대폰 배터리가 꺼졌어.'],
  ['My team was having a meeting when I arrived.', '내가 도착했을 때 우리 팀은 회의 중이었어.'],
  ['The weather is getting colder. I should take out my puffer jacket.', '날씨가 점점 추워지고 있어. 패딩을 꺼내야겠어.'],
  ['I was explaining [something important], but no one was listening.', '나는 중요한 것을 설명하고 있었지만 아무도 듣고 있지 않았어.'],
  ['I was zoning out for a moment.', '나는 잠깐 멍때리고 있었어.'],
  ['Who are you talking to these days?', '요즘 누구와 이야기하고 있어?'],
  ["I'm just lying around doing nothing.", '나는 아무것도 하지 않고 그냥 누워 있어.'],
  ["I'm waiting for you to get here.", '나는 네가 여기 오기를 기다리고 있어.'],
  ["I've been waiting for my package since yesterday.", '나는 어제부터 내 택배를 기다리고 있어.'],
  ["She's still leaving me on read.", '그녀는 아직도 내 메시지를 읽고 답하지 않고 있어.'],
  ['Why are you getting prettier these days?', '너는 요즘 왜 점점 더 예뻐지고 있어?'],
  ["He's been avoiding me lately.", '그는 최근에 나를 피하고 있어.'],
  ["I'm planning my day now.", '나는 지금 하루 계획을 세우고 있어.'],
  ['She was scrolling through social media even during exams.', '그녀는 시험 기간에도 소셜 미디어를 계속 보고 있었어.'],
  ["I'm replying to a friend.", '나는 친구에게 답장하고 있어.'],
  ["I'm waiting for the right moment.", '나는 적절한 순간을 기다리고 있어.'],
  ["He's been deciding [what to order] for 15 minutes.", '그는 15분 동안 무엇을 주문할지 고민하고 있어.'],
  ["I'm getting into a new show.", '나는 새로운 드라마에 빠지고 있어.'],
  ["I'm picking out an outfit because I don't want to wear just anything.", '나는 아무거나 입기 싫어서 옷을 고르고 있어.'],
  ["I'm regretting it. I don't even know why I started this.", '나는 후회하고 있어. 내가 왜 이것을 시작했는지도 모르겠어.'],
  ['I was looking for a seat when you walked in earlier.', '아까 네가 들어왔을 때 나는 자리를 찾고 있었어.'],
  ['Where are you going without telling anyone?', '아무에게도 말하지 않고 너는 어디로 가고 있어?'],
  ["I'm catching up on my KakaoTalk messages.", '나는 밀린 카카오톡 메시지를 확인하고 있어.'],
  ["I'm debating whether to give up.", '나는 포기할지 말지 고민하고 있어.'],
  ["You're making excuses now.", '너는 지금 핑계를 대고 있어.'],
  ["I'm thinking about impulse-buying it.", '나는 그것을 충동구매할까 생각하고 있어.'],
  ['I was hiding under the covers all morning.', '나는 아침 내내 이불 속에 숨어 있었어.'],
  ["I'm on my way home. I'll be there soon.", '나는 집에 가는 중이야. 곧 도착할 거야.'],
  ["I'm trying to cheer myself up.", '나는 내 기분을 풀려고 노력하고 있어.'],
  ["She's rambling on when no one cares.", '아무도 신경 쓰지 않는데 그녀는 혼자 계속 떠들고 있어.'],
  ['I just believed what you said.', '네가 말한 것을 나는 그냥 믿었어.'],
  ['I completely changed my plans because it rained.', '비가 와서 나는 계획을 완전히 바꿨어.'],
  ["I didn't stick to the plans I made.", '나는 내가 세운 계획을 지키지 못했어.'],
  ['I gave up on my diet because of stress.', '스트레스 때문에 나는 다이어트를 포기했어.'],
  ['I solved the problem that nobody else could.', '아무도 풀지 못한 문제를 내가 해결했어.'],
  ['I used to go there often.', '나는 예전에 거기에 자주 갔었어.'],
  ["I didn't answer any calls because I wasn't in the mood.", '그럴 기분이 아니어서 나는 어떤 전화도 받지 않았어.'],
  ['I tried a new recipe I saw on YouTube.', '나는 유튜브에서 본 새 레시피를 시도해 봤어.'],
  ['I came across some old photos I took when I was young.', '어릴 때 찍은 오래된 사진들을 우연히 발견했어.'],
  ['I came up with a good idea nobody thought of.', '아무도 생각하지 못한 좋은 아이디어가 떠올랐어.'],
  ["I missed an opportunity that won't come again.", '다시 오지 않을 기회를 나는 놓쳤어.'],
  ['I rejected the offer the company made.', '회사에서 한 제안을 나는 거절했어.'],
  ['I chatted with the friend I had dinner with.', '같이 저녁 먹었던 친구와 나는 수다를 떨었어.'],
  ["I went to my favorite singer's concert.", '나는 좋아하는 가수의 콘서트에 갔어.'],
  ['I traveled alone to a place where there are few people.', '나는 사람이 적은 곳으로 혼자 여행했어.'],
  ['I fell asleep watching TV because I was too tired.', '너무 피곤해서 나는 TV를 보다가 잠들었어.'],
  ['I hung up the phone before he did.', '그가 끊기 전에 내가 전화를 끊었어.'],
  ["I forgot my friend's birthday, so I couldn't give her a present.", '친구 생일을 까먹어서 나는 선물을 줄 수 없었어.'],
  ['I misunderstood what you said.', '네가 말한 것을 나는 오해했어.'],
  ['I watched Netflix all day because there was too much to watch.', '볼 것이 너무 많아서 나는 하루 종일 넷플릭스만 봤어.'],
  ['I cleared out old emails that had piled up for years.', '몇 년 동안 쌓인 오래된 이메일을 정리했어.'],
  ['I gave my room a deep clean to make it look bigger.', '방이 더 넓어 보이도록 나는 대청소를 했어.'],
  ['I submitted the report before the deadline.', '마감 전에 나는 보고서를 제출했어.'],
  ['I bumped into a friend who used to work with me.', '예전에 함께 일했던 친구를 우연히 만났어.'],
  ['I went straight to the doctor because it looked serious.', '심각해 보여서 나는 바로 병원에 갔어.'],
  ['I made a joke to lighten the mood.', '분위기를 풀려고 나는 농담을 했어.'],
  ['It took me an hour to find the place you told me about.', '네가 말해준 장소를 찾는 데 한 시간이 걸렸어.'],
  ['I was excited even though I was scared before I got on.', '타기 전에는 무서웠지만 나는 신났어.'],
  ['I was shocked because it was higher than I expected.', '예상보다 더 높아서 나는 충격을 받았어.'],
  ['I got frustrated when I heard the project was canceled.', '프로젝트가 취소됐다는 말을 듣고 나는 답답해졌어.'],
  ['I was flustered when I ran into him because it was unexpected.', '예상치 못하게 그를 마주쳐서 나는 당황했어.'],
  ['I was completely exhausted after my workout.', '운동 후에 나는 완전히 지쳤어.'],
  ['Things were really stressful because there was too much to deal with.', '처리할 일이 너무 많아서 상황이 정말 스트레스였어.'],
  ['The trip was worth it even though it was tough.', '힘들었지만 그 여행은 그럴 가치가 있었어.'],
  ['I got annoyed when I found out the flight was delayed.', '비행기가 지연됐다는 것을 알고 나는 짜증이 났어.'],
  ['I was confused even after I heard the explanation.', '설명을 들은 뒤에도 나는 혼란스러웠어.'],
  ['I got nervous because something felt wrong.', '뭔가 이상하게 느껴져서 나는 불안했어.'],
  ['Everything was perfect when the day went as planned.', '하루가 계획대로 흘러가서 모든 것이 완벽했어.'],
  ['The atmosphere was heavy because nobody said anything.', '아무도 말하지 않아서 분위기가 무거웠어.'],
  ['I opened up about my feelings when he asked me.', '그가 물어봐서 나는 내 감정을 솔직히 털어놓았어.'],
  ['I felt blue when it kept raining.', '비가 계속 와서 나는 우울했어.'],
  ['I felt comfortable thanks to the accommodation.', '숙소 덕분에 나는 편안했어.'],
  ["I was so nervous that I couldn't sleep.", '너무 긴장해서 나는 잠을 잘 수 없었어.'],
  ['I got emotional because the acting was amazing.', '연기가 훌륭해서 나는 감동했어.'],
  ['What you said changed my mind.', '네가 한 말이 내 마음을 바꿨어.'],
  ['I got nostalgic when I heard the song we used to listen to.', '우리가 함께 듣던 노래를 듣고 나는 추억에 잠겼어.'],
  ['I was embarrassed because everyone looked at me.', '모두가 나를 쳐다봐서 나는 창피했어.'],
  ['It was better than expected for the price.', '가격 대비 예상보다 더 좋았어.'],
  ['We were completely worn out because we had too much luggage.', '짐이 너무 많아서 우리는 완전히 지쳤어.'],
  ['I was really happy when I was at the beach with my friends.', '친구들과 바닷가에 있었을 때 나는 정말 행복했어.'],
  ["I'll get the report done tonight so I can relax tomorrow.", '내일 편하게 쉴 수 있게 오늘 밤에 보고서를 끝낼래.'],
  ["I'm hanging out at my friend's place to catch up.", '밀린 얘기를 나누려고 친구 집에서 놀기로 했어.'],
  ["You'll be surprised when you hear the news.", '그 소식을 들으면 너는 깜짝 놀랄 거야.'],
  ["I'm going to sign up for the gym to start working out.", '운동을 시작하려고 헬스장에 등록하려고 해.'],
  ["I'll grab the check since you covered it last time.", '지난번에 네가 냈으니 이번에는 내가 계산할게.'],
  ["I'm going to get a new car since my car keeps breaking down.", '차가 계속 고장 나서 나는 새 차를 살 생각이야.'],
  ["He's going to show up late because the traffic is bad.", '차가 막혀서 그는 늦게 나타날 거야.'],
  ["We're having a team dinner for the new employees.", '신입 직원들을 위해 팀 회식이 있어.'],
  ["I'll hear you out no matter how long it is.", '아무리 길어도 네 얘기를 끝까지 들어줄게.'],
  ["I'm traveling abroad during my long vacation.", '긴 휴가 동안 나는 해외여행을 가기로 했어.'],
  ["The delivery's here. I'll get the door.", '배달 왔다. 내가 문을 열어줄게.'],
  ["I'm going to clean up the house. I haven't done it in a while.", '집을 청소하려고 해. 오랫동안 안 했거든.'],
  ["It's going to warm up soon so we can finally go hiking.", '곧 날씨가 따뜻해질 거야. 그러면 드디어 하이킹을 갈 수 있어.'],
  ["I'm going to go back to the academy I used to go to.", '예전에 다니던 학원에 다시 가려고 해.'],
  ["You must be having a hard time. I'll help you out.", '힘들겠다. 내가 도와줄게.'],
  ["I'm seeing my parents for my mom's birthday.", '엄마 생신이라 부모님을 만나기로 했어.'],
  ['The presentation is going to go well since we prepared well.', '우리가 준비를 잘했으니까 발표도 잘될 거야.'],
  ["I'm going to look for a new job that pays better.", '연봉이 더 좋은 새 직장을 찾아보려고 해.'],
  ["You must be tired. I'll grab some coffee for you.", '피곤하겠다. 내가 커피를 가져다줄게.'],
  ["You're going to hear good news soon. I have a good feeling.", '곧 좋은 소식을 들을 거야. 느낌이 좋아.'],
  ["I'm going to hit the gym right after work.", '퇴근하자마자 헬스장에 갈 거야.'],
  ["I'm going to study English to build my resume.", '이력서를 강화하려고 영어 공부를 할 거야.'],
  ["I'm going to stay up late to finish this show.", '이 드라마를 끝내려고 늦게까지 깨어 있을 거야.'],
  ["I'm going to get my hair done because it looks too messy now.", '머리를 하러 갈 거야. 지금 너무 지저분해 보여.'],
  ["I'll go with a salad because I'm trying to eat healthier.", '샐러드로 할래. 건강하게 먹으려고 노력 중이거든.'],
  ["I'm going to lounge around at home over this vacation.", '이번 휴가 내내 집에서 빈둥거릴 거야.'],
  ['People will be here soon, so we need to hurry up.', '곧 사람들이 올 테니 우리는 서둘러야 해.'],
  ["I'm going to sort my papers so I can find them easily later.", '나중에 쉽게 찾으려고 서류를 분류할 거야.'],
  ["I'll get back to you later.", '나중에 다시 연락할게.'],
  ["I'm going to start saving money because there's something I want to buy.", '사고 싶은 것이 있어서 돈을 모으기 시작할 거야.'],
  ["I'll keep it a secret. I won't tell anyone.", '비밀로 할게. 아무에게도 말하지 않을게.'],
  ["I'm going to head to Jeju to see the ocean.", '바다를 보러 제주도에 갈 거야.'],
  ["You'll feel better soon if you get some rest.", '푹 쉬면 곧 기분이 나아질 거야.'],
  ["I'm going to move because my place is too far from work.", '직장이랑 집이 너무 멀어서 이사 가려고 해.'],
  ["I'm going to cook dinner tonight. You just relax.", '오늘 저녁은 내가 만들 테니까 너는 그냥 쉬어.'],
  ["I'm moving to a bigger house next year.", '내년에 더 큰 집으로 이사 가.'],
  ["She's going to give you a call soon because her meeting just ended.", '회의가 방금 끝나서 그녀가 곧 너에게 전화할 거야.'],
  ["I'm going to a get-together this weekend.", '이번 주말에 모임에 가.'],
  ["I'll note it down before I forget.", '까먹기 전에 메모해둘게.'],
  ["I'm going to read more books to get new ideas.", '아이디어를 얻으려고 책을 더 읽으려고 해.'],
  ["I'm going to crash early because I'm completely drained.", '너무 지쳐서 일찍 잘래.'],
  ["I'm going to join a new team to take on a new role.", '새로운 역할을 맡으려고 새 팀으로 옮길 거야.'],
  ['That movie is going to be really fun. I saw great reviews.', '그 영화는 정말 재미있을 거야. 좋은 후기를 봤어.'],
  ["I'm going to attend a dinner gathering right after work.", '퇴근하고 바로 저녁 모임에 참석할 거야.'],
  ["I'll take care of it. I can handle it.", '내가 처리할게. 내가 감당할 수 있어.'],
  ["I was late today, so I'm going to go to work early tomorrow.", '오늘 늦었으니 내일은 일찍 출근하려고 해.'],
  ["I'm going to work late tonight because the deadline is approaching.", '마감이 다가와서 오늘 밤에는 야근할 거야.'],
  ["I'm going to work there on a two-year contract.", '2년 계약으로 거기서 일할 예정이야.'],
  ["I'll check the details and let you know in a bit.", '세부 사항을 확인하고 조금 후에 알려줄게.'],
  ["I'm going to open my own shop someday after I save enough money.", '돈을 충분히 모으면 언젠가 내 가게를 열 거야.'],
  ["I'll get the report done tonight.", '오늘 밤에 보고서를 끝낼게.'],
  ["I clean my room when I'm stressed.", '나는 스트레스를 받으면 방 청소를 해.'],
  ['I gave up on my diet last week.', '지난주에 다이어트를 포기했어.'],
  ["I'm reading a book at a café right now.", '지금 카페에서 책을 읽고 있어.'],
  ["You'll be surprised by the news tomorrow.", '내일 그 소식을 들으면 너는 놀랄 거야.'],
  ['I always put my plans in the calendar.', '나는 항상 계획을 캘린더에 기록해.'],
  ['I chatted with my friend all night yesterday.', '어제 친구와 밤새 수다를 떨었어.'],
  ["I'll be working late tonight.", '오늘 밤 늦게까지 일하고 있을 거야.'],
  ['I visit my parents every weekend.', '나는 주말마다 부모님을 찾아가.'],
  ['I went through my old emails last week.', '지난주에 오래된 이메일을 정리했어.'],
  ["I'll grab the check tonight.", '오늘 밤엔 내가 계산할게.'],
  ['I fix my hair every time I look in the mirror.', '나는 거울을 볼 때마다 머리를 정리해.'],
  ['I just believed you back then.', '그때 나는 그냥 너를 믿었어.'],
  ["I'm redecorating my house this week.", '이번 주에 집을 새로 꾸미고 있어.'],
  ["You'll hear good news soon.", '곧 좋은 소식을 들을 거야.'],
  ['I usually run on the treadmill in the evening.', '나는 보통 저녁에 러닝머신을 뛰어.'],
  ['I fell asleep while watching TV last night.', '어젯밤 TV를 보다가 잠들었어.'],
  ["I'm waiting for the bus right now.", '지금 버스를 기다리고 있어.'],
  ["I'm going to get a new car next year.", '내년에 새 차를 살 계획이야.'],
  ['I enjoy reading books at a café.', '나는 카페에서 책 읽는 것을 즐겨.'],
  ['I took the wrong bus last week and ended up somewhere else.', '지난주에 버스를 잘못 타서 엉뚱한 곳에 갔어.'],
  ["I'm watching a movie with my friend tonight.", '오늘 밤 친구와 영화를 보고 있어.'],
  ["I'm going to spend my vacation with my family.", '이번 휴가는 가족과 보낼 계획이야.'],
  ["I can't live without coffee in the morning.", '나는 아침에 커피 없이는 못 살아.'],
  ['I kept avoiding an important call yesterday.', '어제 중요한 전화를 계속 피했어.'],
  ["I'm getting ready for the meeting now.", '지금 회의 준비를 하고 있어.'],
  ['I sometimes meet my friend at the bus stop.', '나는 가끔 버스 정류장에서 친구를 만나.'],
  ['I lost an important document last week.', '지난주에 중요한 문서를 잃어버렸어.'],
  ["I'm going to take a cooking class next month.", '다음 달에 요리 수업을 들을 거야.'],
  ["I'm relaxing while listening to music.", '음악을 들으면서 쉬고 있어.'],
  ["I just take a nap when I'm tired.", '나는 피곤하면 그냥 낮잠을 자.'],
  ["I didn't answer any calls yesterday because I wasn't in the mood.", '어제는 그럴 기분이 아니어서 어떤 전화도 받지 않았어.'],
  ["I'll be staying up late tonight.", '오늘 밤 늦게까지 깨어 있을 거야.'],
  ['I change into comfy clothes when I get home.', '집에 오면 편한 옷으로 갈아입어.'],
  ['I did a deep clean of my room last month.', '지난달에 방을 대청소했어.'],
  ["I'm doing my homework right now.", '지금 숙제를 하고 있어.'],
  ["I'm going to hang out at my friend's place this weekend.", '이번 주말에 친구 집에서 놀 거야.'],
  ['I often go to the beach with my friends.', '나는 친구들과 해변에 자주 가.'],
  ['I completely changed my plans last week.', '지난주에 계획을 완전히 바꿨어.'],
  ["I'm going to sign up for the gym next month.", '다음 달에 헬스장에 등록할 거야.'],
  ["I rarely check KakaoTalk while I'm working.", '나는 일하는 동안 카카오톡을 거의 확인하지 않아.'],
  ['I left my phone at home last night.', '어젯밤 휴대폰을 집에 두고 왔어.'],
  ["I'm getting ready for breakfast now.", '지금 아침 먹을 준비를 하고 있어.'],
  ['I usually take a walk at lunchtime.', '나는 보통 점심시간에 산책해.'],
  ["I'm going to start studying for an English test next year.", '내년에 영어 시험 공부를 시작할 거야.'],
  ['I went to a concert alone for the first time last month.', '지난달에 처음으로 혼자 콘서트에 갔어.'],
  ["I'm listening to music on the bus right now.", '지금 버스에서 음악을 듣고 있어.'],
  ['I stretch in the park every morning.', '나는 매일 아침 공원에서 스트레칭해.'],
  ['I hid my feelings back then.', '그때 나는 감정을 숨겼어.']
]);

function getKoreanPrompt(sentence) {
  const mapped = koreanPromptByEnglish.get(sentence?.text || '');
  if (mapped) return mapped;
  return formatKoreanPrompt(sentence?.promptKo) || '원본 자료의 영어 문장을 보고 같은 뜻의 완전한 한국어 문장으로 떠올린다.';
}

function formatKoreanPrompt(value) {
  return String(value || '')
    .replace(/\s+([?.!,])/g, '$1')
    .replace(/\s*\/\s*/g, ' / ')
    .split(' / ')
    .map(joinSplitHangulWords)
    .join(' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

function joinSplitHangulWords(segment) {
  const tokens = String(segment || '').split(/\s+/).filter(Boolean);
  const merged = [];
  let buffer = [];
  for (const token of tokens) {
    if (/^[가-힣]$/.test(token)) {
      buffer.push(token);
      continue;
    }
    if (buffer.length) {
      merged.push(buffer.join(''));
      buffer = [];
    }
    merged.push(token);
  }
  if (buffer.length) merged.push(buffer.join(''));
  return merged.join(' ');
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

function SourceSentenceList({ step, sentenceIndex, onSelectSentence, onMaterialsUpdated }) {
  const sentences = step.sentences || [];
  const visibleSentences = sentences.slice(0, 50);
  return (
    <section className="source-viewer">
      <header>
        <div>
          <span>원본 병합</span>
          <strong>{visibleSentences.length}개 영어문장</strong>
        </div>
      </header>
      <div className="source-sentence-list">
        {visibleSentences.map((sentence, index) => (
          <button
            key={sentence.id}
            className={index === sentenceIndex ? 'active' : ''}
            onClick={() => onSelectSentence(index)}
          >
            <span>{sentence.exerciseNumber || index + 1}</span>
            <strong>{sentence.text}</strong>
          </button>
        ))}
      </div>
      <SourceAudioPlayer step={step} />
      <MaterialsManager onMaterialsUpdated={onMaterialsUpdated} />
    </section>
  );
}

function MaterialsManager({ onMaterialsUpdated }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    setStatus('자료 갱신 중');
    const nextManifest = await onMaterialsUpdated();
    setBusy(false);
    setStatus(nextManifest ? `${nextManifest.steps?.length || 0}개 스텝 반영됨` : '갱신 실패');
  }

  async function upload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setStatus('PDF 처리 중');
    try {
      const payloadFiles = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: await readFileAsBase64(file)
        }))
      );
      const response = await fetch(apiUrl('/api/materials/upload'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payloadFiles })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'PDF 추가 실패');
      const uploadedStep = payload.uploadedSteps?.[payload.uploadedSteps.length - 1] || null;
      await onMaterialsUpdated(uploadedStep);
      setStatus(`${payload.uploadedSteps?.length || 0}개 스텝 갱신됨`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="materials-manager">
      <input ref={fileInputRef} type="file" accept="application/pdf" multiple onChange={upload} />
      <button className="secondary-button compact" type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
        <FileUp size={16} />
        PDF 추가
      </button>
      <button className="icon-button" type="button" title="자료 새로고침" onClick={refresh} disabled={busy}>
        <RefreshCw size={16} />
      </button>
      {status && <span>{status}</span>}
    </div>
  );
}

function SourceAudioPlayer({ step }) {
  const lines = useMemo(() => buildSourceReadingLines(step), [step]);
  const [reading, setReading] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [rate, setRate] = useState(0.86);
  const utteranceRef = useRef(null);
  const lineIndexRef = useRef(0);
  const readingRef = useRef(false);
  const rateRef = useRef(rate);

  useEffect(() => {
    lineIndexRef.current = lineIndex;
  }, [lineIndex]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    stopReading();
    setLineIndex(0);
    return cancelSpeech;
  }, [step.id]);

  function cancelSpeech() {
    readingRef.current = false;
    utteranceRef.current = null;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function stopReading() {
    cancelSpeech();
    setReading(false);
  }

  function speakAt(index) {
    if (!('speechSynthesis' in window) || !lines.length) return;
    const bounded = Math.max(0, Math.min(lines.length - 1, index));
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lines[bounded]);
    utterance.lang = 'en-US';
    utterance.rate = rateRef.current;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (!readingRef.current) return;
      const nextIndex = bounded + 1;
      if (nextIndex >= lines.length) {
        stopReading();
        setLineIndex(0);
        return;
      }
      lineIndexRef.current = nextIndex;
      setLineIndex(nextIndex);
      speakAt(nextIndex);
    };
    utterance.onerror = stopReading;
    utteranceRef.current = utterance;
    lineIndexRef.current = bounded;
    setLineIndex(bounded);
    readingRef.current = true;
    setReading(true);
    window.speechSynthesis.speak(utterance);
  }

  function startReading() {
    speakAt(lineIndexRef.current);
  }

  function rewind() {
    const previous = Math.max(0, lineIndexRef.current - 1);
    if (readingRef.current) {
      speakAt(previous);
      return;
    }
    setLineIndex(previous);
  }

  function changeRate(nextRate) {
    rateRef.current = nextRate;
    setRate(nextRate);
    if (readingRef.current) {
      speakAt(lineIndexRef.current);
    }
  }

  if (!lines.length) return null;

  return (
    <div className="source-audio">
      <div className="source-audio-status">
        <span>듣기 연습</span>
        <strong>{lineIndex + 1}/{lines.length}</strong>
      </div>
      <p>{lines[lineIndex]}</p>
      <div className="source-audio-controls">
        <button className="primary-button compact" onClick={startReading} disabled={reading}>
          <Volume2 size={16} />
          전체 읽기
        </button>
        <button className="secondary-button compact" onClick={stopReading} disabled={!reading}>
          <PauseCircle size={16} />
          중단
        </button>
        <button className="secondary-button compact" onClick={rewind}>
          <RotateCcw size={16} />
          5초 전
        </button>
        <label className="rate-control">
          <span>속도</span>
          <select value={rate} onChange={(event) => changeRate(Number(event.target.value))}>
            <option value="0.7">0.7x</option>
            <option value="0.86">0.86x</option>
            <option value="1">1.0x</option>
            <option value="1.15">1.15x</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function buildSourceReadingLines(step) {
  return (step.sentences || [])
    .slice(0, 50)
    .map((sentence, index) => `${index + 1}. ${sentence.text}`)
    .filter(Boolean);
}

function LiveTranslateDock({ sentence }) {
  const [status, setStatus] = useState('확인 중');
  const [configured, setConfigured] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('ko');
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const [liveStats, setLiveStats] = useState(null);
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
    setLiveStats(null);
    setLevel(0);
    translatorRef.current?.close();
    try {
      translatorRef.current = await createGeminiLiveTranslator({
        targetLanguage,
        onStatus: setStatus,
        onAudioLevel: setLevel,
        onError: setError,
        onStats: setLiveStats,
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
    setLiveStats(null);
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
          <option value="vi">Vietnamese</option>
          <option value="zh-CN">Chinese</option>
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
      <div className="live-stats">
        <span>마이크 {Math.round(Math.min(1, level * 12) * 100)}%</span>
        <span>{liveStats?.setupReady ? '준비' : '연결중'}</span>
        <span>{liveStats?.activity || '대기'}</span>
        <span>턴 {liveStats?.activityTurns || 0}</span>
        <span>전송 {liveStats?.sentChunks || 0}</span>
        <span>끝 {liveStats?.sentSignals || 0}</span>
        <span>수신 {liveStats?.receivedMessages || 0}</span>
        {liveStats?.voiceThreshold ? (
          <span>레벨 {Math.round((liveStats.voiceLevel || 0) * 1000)}/{Math.round(liveStats.voiceThreshold * 1000)}</span>
        ) : null}
        {liveStats?.inputSampleRate ? <span>{liveStats.inputSampleRate}Hz</span> : null}
        {liveStats?.inputState ? <span>{liveStats.inputState}</span> : null}
      </div>
      <div className="transcript-mini">
        <p>{inputTranscript || '입력 대기'}</p>
        <strong>{outputTranscript || '번역 대기'}</strong>
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

const answerProfiles = {
  'present-simple': [
    {
      context: /\b(get|go|come|arrive|home|house|room|door|shower|wash|change|rest)\b/,
      correction: 'I usually wash my hands when I get home.',
      contextHint: '집에 왔을 때 하는 행동을 답변에 넣는다.'
    },
    {
      context: /\b(before|bed|sleep|asleep|night|instagram|phone|read|book|check)\b/,
      correction: 'I usually check my phone before I fall asleep.',
      contextHint: '자기 전 행동을 답변에 넣는다.'
    },
    {
      context: /\b(after|lunch|eat|meal|walk|coffee|rest|study|work)\b/,
      correction: 'I usually take a walk after lunch.',
      contextHint: '점심 후 행동을 답변에 넣는다.'
    },
    {
      context: /\b(tired|stressed|stress|rest|music|walk|sleep|relax|friends|coffee)\b/,
      correction: 'I listen to music when I feel tired or stressed.',
      contextHint: '피곤하거나 스트레스를 받을 때 하는 행동을 넣는다.'
    },
    {
      context: /\b(weekend|weekends|saturday|sunday|morning|sleep|late|meet|rest|clean)\b/,
      correction: 'I usually sleep late on weekends.',
      contextHint: '주말에 하는 일을 답변에 넣는다.'
    },
    {
      context: /\b(weather|rain|rains|rainy|bad|outside|home|umbrella|stay)\b/,
      correction: "I stay home when the weather is bad.",
      contextHint: '날씨가 나쁠 때 하는 행동을 넣는다.'
    },
    {
      context: /\b(buy|shopping|reviews|review|price|size|try|check|something|clothes)\b/,
      correction: 'I check reviews before I buy something.',
      contextHint: '무언가를 사기 전에 하는 일을 넣는다.'
    },
    {
      context: /\b(after|work|school|class|home|walk|rest|exercise|gym|dinner)\b/,
      correction: 'I prefer taking a walk after work.',
      contextHint: '일이나 학교가 끝난 뒤 선호하는 행동을 넣는다.'
    },
    {
      context: /\b(important|work|study|focus|notifications|phone|turn|off|quiet)\b/,
      correction: 'I turn off notifications when I have important work.',
      contextHint: '중요한 일을 할 때 하는 행동을 넣는다.'
    },
    {
      context: /\b(travel|trip|photos|pictures|hotel|food|walk|visit|place)\b/,
      correction: 'I take a lot of photos when I travel.',
      contextHint: '여행할 때 하는 행동을 넣는다.'
    }
  ],
  progressive: [
    {
      context: /\b(health|healthy|vegetables|salad|vitamins|exercise|workout|sleep|water|diet)\b/,
      correction: 'I am eating more vegetables these days for my health.',
      contextHint: '건강을 위해 요즘 하고 있는 일을 넣는다.'
    },
    {
      context: /\b(friend|friends|mom|dad|parents|teacher|coworker|classmate|him|her|them|someone)\b/,
      correction: 'I am talking to my friend often these days.',
      contextHint: '요즘 자주 이야기하는 사람을 넣는다.'
    },
    {
      context: /\b(wait|waiting|package|reply|call|bus|train|friend|news|result|now)\b/,
      correction: 'I am waiting for my package now.',
      contextHint: '지금 기다리는 대상을 넣는다.'
    },
    {
      context: /\b(thinking|about|plan|plans|future|work|trip|weekend|what|idea)\b/,
      correction: 'I am thinking about my weekend plans these days.',
      contextHint: '요즘 생각하고 있는 내용을 넣는다.'
    },
    {
      context: /\b(11|pm|yesterday|night|watching|studying|sleeping|working|reading)\b/,
      correction: 'I was watching Netflix around 11 PM yesterday.',
      contextHint: '어제 밤 11시쯤 하고 있던 일을 넣는다.'
    },
    {
      context: /\b(called|call|phone|recently|shower|driving|working|sleeping|watching)\b/,
      correction: 'I was taking a shower when someone called me recently.',
      contextHint: '최근 전화가 왔을 때 하고 있던 일을 넣는다.'
    },
    {
      context: /\b(planning|plan|schedule|day|today|week|now)\b/,
      correction: 'I am planning my day now.',
      contextHint: '지금 계획하고 있는 일을 넣는다.'
    },
    {
      context: /\b(getting into|show|drama|music|game|book|hobby|these days)\b/,
      correction: 'I am getting into a new show these days.',
      contextHint: '요즘 빠져드는 대상을 넣는다.'
    },
    {
      context: /\b(cheer|myself|up|better|videos|music|walk|show|trying)\b/,
      correction: 'I am watching funny videos to cheer myself up.',
      contextHint: '기분을 풀기 위해 하고 있는 일을 넣는다.'
    },
    {
      context: /\b(deciding|debating|whether|what|order|eat|buy|go|right now|now)\b/,
      correction: 'I am deciding what to eat right now.',
      contextHint: '지금 결정하거나 고민하는 내용을 넣는다.'
    }
  ],
  'past-simple': [
    {
      context: /\b(believed|thought|trusted|recently|said|news|story)\b/,
      correction: 'I believed what my friend said recently.',
      contextHint: '최근에 믿었던 내용을 과거로 말한다.'
    },
    {
      context: /\b(changed|plan|plans|because|rain|weather|cold|hot)\b/,
      correction: 'I changed my plans because of the rain.',
      contextHint: '날씨 때문에 바꾼 일을 과거로 말한다.'
    },
    {
      context: /\b(stick|plan|plans|workout|diet|study|schedule|made)\b/,
      correction: "I didn't stick to my workout plan.",
      contextHint: '지키지 못한 계획을 과거로 말한다.'
    },
    {
      context: /\b(gave|give|up|diet|exercise|plan|stress|because)\b/,
      correction: 'I gave up on my diet because of stress.',
      contextHint: '스트레스 때문에 포기한 일을 과거로 말한다.'
    },
    {
      context: /\b(solved|problem|issue|work|school|recently)\b/,
      correction: 'I solved a problem at work recently.',
      contextHint: '최근 해결한 문제를 과거로 말한다.'
    },
    {
      context: /\b(used|go|there|often|school|cafe|academy|gym)\b/,
      correction: 'I used to go to that cafe often.',
      contextHint: '예전에 자주 갔던 곳을 말한다.'
    },
    {
      context: /\b(tried|recipe|online|youtube|saw|after|new)\b/,
      correction: 'I tried a new recipe after seeing it online.',
      contextHint: '온라인에서 보고 시도한 일을 과거로 말한다.'
    },
    {
      context: /\b(came|across|old|thing|photos|messages|recently|found)\b/,
      correction: 'I came across old photos recently.',
      contextHint: '최근 우연히 발견한 오래된 것을 말한다.'
    },
    {
      context: /\b(nervous|shocked|presentation|test|exam|interview|when|before)\b/,
      correction: 'I was really nervous before my presentation.',
      contextHint: '긴장하거나 놀랐던 경험을 과거로 말한다.'
    },
    {
      context: /\b(worth|tough|trip|experience|hard|difficult|even though)\b/,
      correction: 'The trip was worth it even though it was tough.',
      contextHint: '힘들었지만 가치 있었던 경험을 말한다.'
    }
  ],
  future: [
    {
      context: /\b(will|'ll|probably|later|soon|get back|call|text|rest|watch)\b/,
      correction: "I'll probably get back to you later.",
      contextHint: '나중에 아마 할 일을 미래 표현으로 말한다.'
    },
    {
      context: /\b(going to|gonna|tonight|clean|study|watch|cook|work|room)\b/,
      correction: "I'm going to clean up my room tonight.",
      contextHint: '오늘 밤 할 일을 미래 표현으로 말한다.'
    },
    {
      context: /\b(meeting|meet|seeing|tomorrow|friend|parents|mom|dad|coworker)\b/,
      correction: "I'm meeting my friend tomorrow.",
      contextHint: '내일 만날 사람을 말한다.'
    },
    {
      context: /\b(sign|up|gym|class|course|lesson|club|going to)\b/,
      correction: "I'm going to sign up for the gym.",
      contextHint: '등록하려는 것을 말한다.'
    },
    {
      context: /\b(will|'ll|help|friend|mom|dad|someone|with|homework|work)\b/,
      correction: "I'll help my friend with homework.",
      contextHint: '누군가를 무엇으로 도울지 말한다.'
    },
    {
      context: /\b(going to|soon|clean|sort|room|house|desk|papers|emails)\b/,
      correction: "I'm going to clean up my house soon.",
      contextHint: '곧 정리하거나 청소할 것을 말한다.'
    },
    {
      context: /\b(traveling|travel|trip|vacation|next|abroad|jeju|busan|during)\b/,
      correction: "I'm traveling abroad during my next vacation.",
      contextHint: '다음 휴가 동안 여행할 곳을 말한다.'
    },
    {
      context: /\b(going to|study|practice|english|workout|skill|piano|exercise)\b/,
      correction: "I'm going to study English.",
      contextHint: '공부하거나 연습할 것을 말한다.'
    },
    {
      context: /\b(going to|right after|after work|gym|home|dinner|meet|study)\b/,
      correction: "I'm going to hit the gym right after work.",
      contextHint: '퇴근 직후 할 일을 말한다.'
    },
    {
      context: /\b(think|going to|will|go well|presentation|test|meeting|project)\b/,
      correction: 'I think the presentation is going to go well.',
      contextHint: '잘될 것 같은 일을 말한다.'
    }
  ],
  'infinitive-gerund': [
    {
      context: /\b(want|try|trying|taste|visit|check out|learn|new|these days)\b/,
      correction: 'I want to try a new dessert these days.',
      contextHint: '요즘 해보고 싶은 일을 want to 또는 try to로 말한다.'
    },
    {
      context: /\b(need|fix|finish|work|problem|mistake|soon|files|room)\b/,
      correction: 'I need to fix a small mistake soon.',
      contextHint: '곧 고치거나 끝내야 하는 일을 need to로 말한다.'
    },
    {
      context: /\b(learn|learning|how to|cook|makeup|answer|use|speak)\b/,
      correction: 'I am learning how to cook simple meals.',
      contextHint: '배우고 있는 방법을 how to로 말한다.'
    },
    {
      context: /\b(like|enjoy|relax|reading|listening|watching|spending|free time)\b/,
      correction: 'I like listening to music when I want to relax.',
      contextHint: '좋아하는 활동을 like 또는 enjoy + -ing로 말한다.'
    },
    {
      context: /\b(avoid|tired|late|buying|talking|doing|areas|stress)\b/,
      correction: 'I avoid making big decisions when I am tired.',
      contextHint: '피하는 행동을 avoid + -ing로 말한다.'
    },
    {
      context: /\b(decided|decide|recently|start|try|change|meet|go)\b/,
      correction: 'I decided to start a new routine recently.',
      contextHint: '최근 결정한 일을 decided to로 말한다.'
    },
    {
      context: /\b(thinking|about|of|change|changing|quit|move|buy|go)\b/,
      correction: 'I am thinking about changing my routine.',
      contextHint: '고민 중인 변화를 thinking about + -ing로 말한다.'
    },
    {
      context: /\b(place|visit|cafe|café|relax|where|photos|travel)\b/,
      correction: 'I want to visit a place where I can relax.',
      contextHint: '가보고 싶은 장소를 want to와 where 설명으로 말한다.'
    },
    {
      context: /\b(people|person|friend|friends|spending|time|with|relaxed)\b/,
      correction: 'I like spending time with people who make me feel relaxed.',
      contextHint: '함께 있고 싶은 사람을 like + -ing와 who 설명으로 말한다.'
    },
    {
      context: /\b(information|find|trying|looking|search|answer|question)\b/,
      correction: 'I am trying to find the information I need.',
      contextHint: '찾으려는 정보를 trying to로 말한다.'
    }
  ],
  mixed: [
    {
      context: /\b(stressed|stress|clean|room|walk|music|sleep|relax)\b/,
      correction: "I clean my room when I'm stressed.",
      contextHint: '스트레스를 받을 때 보통 하는 행동을 현재 시제로 말한다.',
      grammarKind: 'present-simple'
    },
    {
      context: /\b(last week|gave|went|took|lost|changed|chatted|diet|emails|concert)\b/,
      correction: 'I gave up on my diet last week.',
      contextHint: '지난주에 한 일을 과거 시제로 말한다.',
      grammarKind: 'past-simple'
    },
    {
      context: /\b(right now|now|reading|waiting|doing|getting|watching|working)\b/,
      correction: "I'm reading a book right now.",
      contextHint: '지금 하고 있는 일을 진행형으로 말한다.',
      grammarKind: 'progressive'
    },
    {
      context: /\b(tonight|will|'ll|working|report|movie|late|check)\b/,
      correction: "I'll get the report done tonight.",
      contextHint: '오늘 밤 할 일을 will이나 미래 표현으로 말한다.',
      grammarKind: 'future'
    },
    {
      context: /\b(next month|going to|class|gym|sign|take|cooking)\b/,
      correction: "I'm going to take a cooking class next month.",
      contextHint: '다음 달 계획을 be going to로 말한다.',
      grammarKind: 'future'
    },
    {
      context: /\b(last night|was|were|watching|working|reading|sleeping|waiting)\b/,
      correction: 'I was watching TV last night.',
      contextHint: '어젯밤 하고 있던 일을 과거 진행형으로 말한다.',
      grammarKind: 'progressive'
    },
    {
      context: /\b(every weekend|weekends|visit|parents|beach|friend|usually|often)\b/,
      correction: 'I visit my parents every weekend.',
      contextHint: '주말마다 하는 일을 현재 시제로 말한다.',
      grammarKind: 'present-simple'
    },
    {
      context: /\b(gave|give|up|diet|plan|recently|last|stopped|quit)\b/,
      correction: 'I gave up on my diet recently.',
      contextHint: '최근 포기한 일을 과거 시제로 말한다.',
      grammarKind: 'past-simple'
    },
    {
      context: /\b(next year|going to|start|study|studying|english|test)\b/,
      correction: "I'm going to start studying for an English test next year.",
      contextHint: '내년에 시작할 일을 미래 표현으로 말한다.',
      grammarKind: 'future'
    },
    {
      context: /\b(good news|hear|will|'ll|soon|think)\b/,
      correction: "I think I'll hear good news soon.",
      contextHint: '곧 들을 좋은 소식을 미래 표현으로 말한다.',
      grammarKind: 'future'
    }
  ]
};

function scoreFreeAnswer(answer, step, question, questionIndex = 0) {
  const raw = String(answer || '').trim();
  const normalized = normalizeAnswer(raw);
  const profile = getAnswerProfile(step, questionIndex);
  const issues = [];

  if (!normalized) {
    return buildAnswerFeedback({
      score: 0,
      issues: ['답변을 입력한다.'],
      correction: profile.correction,
      message: '답변을 입력한 뒤 확인할 수 있다.'
    });
  }

  if (/[가-힣]/.test(raw) && !/[A-Za-z]{2,}/.test(raw)) {
    issues.push('영어 문장으로 답변한다.');
  }

  const grammarIssues = getGrammarIssues(normalized, profile.grammarKind || step?.patternKind);
  const contextOk = profile.context.test(normalized);
  if (!contextOk) issues.push(profile.contextHint || '질문의 핵심 상황을 답변에 포함한다.');
  issues.push(...grammarIssues);

  const grammarScore = Math.max(0, 1 - grammarIssues.length * 0.25);
  const contextScore = contextOk ? 1 : 0.55;
  const score = Math.min(1, Math.max(0, grammarScore * 0.68 + contextScore * 0.32));
  const isCorrect = score >= 0.82 && issues.length === 0;

  return buildAnswerFeedback({
    score,
    issues,
    correction: isCorrect ? polishSentence(raw) : buildCorrection(raw, profile, grammarIssues, contextOk),
    message: isCorrect
      ? '맥락과 문법이 자연스럽다.'
      : `맥락 또는 문법을 조금 고치면 더 정확하다. 질문: ${question}`,
    isCorrect
  });
}

function getAnswerProfile(step, questionIndex) {
  const kind = step?.patternKind || 'present-simple';
  const profiles = answerProfiles[kind] || answerProfiles['present-simple'];
  return profiles[questionIndex % profiles.length];
}

function getGrammarIssues(normalized, patternKind) {
  const issues = [];
  if (!/\b(i|you|we|they|he|she|it|there|this|that|my|the|a|an|yes|no)\b/.test(normalized)) {
    issues.push('주어가 보이도록 완전한 문장으로 쓴다.');
  }
  if (!hasFiniteVerb(normalized)) {
    issues.push('동사가 들어간 완전한 문장으로 쓴다.');
  }

  if (patternKind === 'progressive') {
    const hasProgressive = /\b(am|is|are|was|were|been|'m|'re|'s)\s+[a-z]+ing\b/.test(normalized)
      || /\b(have|has|had)\s+been\s+[a-z]+ing\b/.test(normalized);
    if (!hasProgressive) issues.push('진행형은 be 동사와 -ing 동사를 함께 쓴다.');
  } else if (patternKind === 'past-simple') {
    const hasPast = /\b(was|were|did|didn't|couldn't|went|came|got|felt|made|took|gave|hung|forgot|misunderstood|changed|believed|tried|solved|missed|rejected|traveled|travelled|watched|opened|saw|found|heard|had|used to)\b/.test(normalized)
      || /\b[a-z]+ed\b/.test(normalized);
    if (!hasPast) issues.push('과거 질문에는 과거 동사나 used to를 쓴다.');
  } else if (patternKind === 'future') {
    const hasFuture = /\b(will|won't|'ll|going to|gonna|am going|is going|are going)\b/.test(normalized)
      || /\b(am|is|are|'m|'re|'s)\s+[a-z]+ing\b/.test(normalized);
    if (!hasFuture) issues.push('미래 질문에는 will, be going to, 또는 예정된 be -ing를 쓴다.');
  } else if (patternKind === 'infinitive-gerund') {
    const hasInfinitive = /\b(want|hope|plan|decide|decided|need|try|trying|learn|learning|agree|agreed|offer|offered|manage|managed|like|would like)\s+(not\s+)?to\s+[a-z]+\b/.test(normalized)
      || /\bhow to\s+[a-z]+\b/.test(normalized);
    const hasGerund = /\b(like|enjoy|love|hate|avoid|finish|finished|mind|miss|practice|practicing|deny|denied|recommend|recommended|thinking about|thinking of|think about|think of|spend|spending)\s+[a-z]+ing\b/.test(normalized);
    if (!hasInfinitive && !hasGerund) issues.push('to 부정사나 동명사 형태를 넣어 말한다.');
  } else {
    const hasPastOnly = /\b(yesterday|last week|last night|ago|was|were|went|did|didn't)\b/.test(normalized);
    const hasFutureOnly = /\b(will|going to|tomorrow|next week)\b/.test(normalized);
    if (hasPastOnly || hasFutureOnly) issues.push('현재 시제 질문에는 보통 현재형 습관 표현을 쓴다.');
  }

  return issues;
}

function hasFiniteVerb(normalized) {
  return /\b(am|is|are|was|were|be|been|being|do|does|did|have|has|had|will|would|can|could|should|must|go|goes|went|come|comes|came|get|gets|got|make|makes|made|take|takes|took|feel|feels|felt|think|thinks|thought|want|wants|like|likes|prefer|prefers|try|tries|tried|watch|watches|watched|study|studies|studied|work|works|worked|meet|meets|met|talk|talks|talked|help|helps|helped|eat|eats|ate|sleep|sleeps|slept|read|reads|clean|cleans|cleaned|buy|buys|bought|check|checks|checked|listen|listens|listened|travel|travels|traveled|plan|plans|planned|wait|waits|waiting|decide|decides|decided|believe|believes|believed|solve|solves|solved|give|gives|gave)\b/.test(normalized)
    || /\b[a-z]+ed\b/.test(normalized)
    || /\b(am|is|are|was|were|'m|'re|'s)\s+[a-z]+ing\b/.test(normalized);
}

function buildCorrection(raw, profile, grammarIssues, contextOk) {
  if (!contextOk || grammarIssues.length > 0) return profile.correction;
  return polishSentence(raw);
}

function polishSentence(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const normalizedI = text.replace(/\bi\b/g, 'I');
  const capitalized = normalizedI.charAt(0).toUpperCase() + normalizedI.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function buildAnswerFeedback({ score, issues, correction, message, isCorrect = false }) {
  return {
    score,
    issues: [...new Set(issues)],
    correction,
    message,
    isCorrect
  };
}
