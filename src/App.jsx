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
      onProgress={onProgress}
    />
  );
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

      <SentenceFocus sentence={sentence} analysis={analysis} marker="오늘의 기준 문장" sentenceVocabularyOnly />
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

function AnswerPane({ step, onProgress }) {
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
    const next = scoreFreeAnswer(answer, step);
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
            답변 확인
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
          <div className={`result-box ${result.score >= 0.7 ? 'good' : 'needs-work'}`}>
            {result.score >= 0.7 ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{Math.round(result.score * 100)}% · {result.message}</span>
          </div>
        )}
      </Panel>
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
          <Glossary glossary={analysis.glossary} inline empty />
        ) : sentenceVocabularyOnly ? (
          <>
            <p>{sentence.text}</p>
            <Glossary glossary={analysis.glossary} inline empty />
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
            <Glossary glossary={analysis.glossary} />
          </>
        )}
      </div>
    </Panel>
  );
}

function Glossary({ glossary, inline = false, empty = false }) {
  if (!glossary.length) {
    return empty ? <div className={`glossary ${inline ? 'inline' : ''}`} aria-label="중급 단어 없음" /> : null;
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
  ["I'm going to open my own shop someday after I save enough money.", '돈을 충분히 모으면 언젠가 내 가게를 열 거야.']
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
  if (step?.patternKind === 'past-simple') {
    const hasPastSignal = /\b(yesterday|last|ago|when|before|after|used to)\b/.test(normalized);
    const hasPastVerb = /\b(was|were|did|didn't|couldn't|went|came|got|felt|made|took|gave|hung|forgot|misunderstood|changed|believed|tried|solved|missed|rejected|traveled|watched|opened)\b/.test(normalized)
      || /\b[a-z]+ed\b/.test(normalized);
    const score = Number(hasSubject) * 0.3 + Number(hasPastVerb) * 0.45 + Number(hasPastSignal) * 0.25;
    return {
      score,
      message: score >= 0.7 ? '과거 시제 패턴이 보인다.' : '과거 동사나 과거 시간 신호를 더 분명히 넣는다.'
    };
  }
  if (step?.patternKind === 'future') {
    const hasFutureForm = /\b(will|won't|going to|gonna|am going|is going|are going)\b/.test(normalized)
      || /\b(am|is|are)\s+[a-z]+ing\b/.test(normalized);
    const hasFutureSignal = /\b(tonight|tomorrow|later|soon|next|probably|right after|this weekend)\b/.test(normalized);
    const score = Number(hasSubject) * 0.3 + Number(hasFutureForm) * 0.45 + Number(hasFutureSignal) * 0.25;
    return {
      score,
      message: score >= 0.7 ? '미래 표현 패턴이 보인다.' : 'will, be going to, be -ing 또는 미래 시간 신호를 넣는다.'
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
