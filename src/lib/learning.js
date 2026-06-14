export const workflows = [
  { id: 'understand', label: '이해하기' },
  { id: 'pattern', label: '패턴 익히기' },
  { id: 'make', label: '문장 만들기' },
  { id: 'speak', label: '소리내어 말하기' },
  { id: 'answer', label: '질문에 대답하기' }
];

const phraseGlossary = [
  ['run out', '다 떨어지다'],
  ['check reviews', '후기를 확인하다'],
  ['change into', '갈아입다'],
  ['fall asleep', '잠들다'],
  ['wake up', '일어나다'],
  ['get grumpy', '예민해지다'],
  ['go as planned', '계획대로 되다'],
  ['wear a mask', '마스크를 쓰다'],
  ['fine dust', '미세먼지'],
  ['stand by the door', '문 옆에 서다'],
  ['clear my head', '머리를 식히다'],
  ['quiet time', '조용한 시간'],
  ['focus', '집중하다'],
  ['sing along', '따라 부르다'],
  ['comes on', '노래가 나오다'],
  ['body feels stiff', '몸이 찌뿌둥하다'],
  ['feels stuffy', '답답하게 느껴지다'],
  ['as soon as', '하자마자'],
  ['go straight', '곧장 가다'],
  ['prefer', '더 좋아하다'],
  ['instead of', '대신에'],
  ['turn off notifications', '알림을 끄다'],
  ['talking to', '대화하다'],
  ['lying around', '빈둥거리다'],
  ['doing nothing', '아무것도 안 하다'],
  ['waiting for', '기다리다'],
  ['since yesterday', '어제부터'],
  ['leaving me on read', '읽씹하다'],
  ['getting prettier', '예뻐지다'],
  ['avoiding me', '피하다'],
  ['planning my day', '하루 계획을 세우다'],
  ['scrolling through', '스크롤하며 보다'],
  ['right moment', '적절한 순간'],
  ['getting into', '빠져들다'],
  ['picking out', '고르다'],
  ['outfit', '옷차림'],
  ['regretting it', '후회하다'],
  ['looking for a seat', '자리를 찾다'],
  ['without telling anyone', '아무에게도 말하지 않고'],
  ['catching up on', '밀린 것을 따라잡다'],
  ['debating whether', '할지 말지 고민하다'],
  ['making excuses', '핑계를 대다'],
  ['impulse-buying', '충동구매하다'],
  ['hiding under the covers', '이불 속에 숨다'],
  ['on my way home', '집에 가는 중이다'],
  ['cheer myself up', '기분을 풀다'],
  ['rambling on', '혼자 계속 떠들다'],
  ['work out', '운동하다'],
  ['on weekends', '주말마다'],
  ['every morning', '매일 아침'],
  ['these days', '요즘'],
  ['lately', '최근에'],
  ['all morning', '아침 내내']
];

const commonWords = [
  ['always', '항상'],
  ['usually', '보통'],
  ['often', '자주'],
  ['sometimes', '가끔'],
  ['rarely', '드물게'],
  ['never', '절대 안'],
  ['before', '전에'],
  ['after', '후에'],
  ['when', '할 때'],
  ['while', '하는 동안'],
  ['because', '왜냐하면'],
  ['still', '아직도'],
  ['now', '지금'],
  ['every', '매/마다'],
  ['friend', '친구'],
  ['package', '택배'],
  ['cosmetics', '화장품'],
  ['comfortable', '편한'],
  ['cute', '귀여운'],
  ['messy', '지저분한'],
  ['stuffy', '답답한'],
  ['hungry', '배고픈'],
  ['sick', '아픈'],
  ['exercise', '운동하다'],
  ['notification', '알림']
];

export function normalizeAnswer(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scoreAnswer(expected, actual) {
  const expectedTokens = normalizeAnswer(expected).split(' ').filter(Boolean);
  const actualTokens = normalizeAnswer(actual).split(' ').filter(Boolean);
  if (expectedTokens.length === 0 || actualTokens.length === 0) {
    return { score: 0, missing: expectedTokens, matched: [] };
  }
  const actualSet = new Set(actualTokens);
  const matched = expectedTokens.filter((token) => actualSet.has(token));
  const missing = expectedTokens.filter((token) => !actualSet.has(token));
  const coverage = matched.length / expectedTokens.length;
  const orderBonus = normalizeAnswer(actual).includes(expectedTokens.slice(0, 3).join(' ')) ? 0.08 : 0;
  return {
    score: Math.min(1, coverage + orderBonus),
    missing: [...new Set(missing)].slice(0, 6),
    matched: [...new Set(matched)].slice(0, 8)
  };
}

export function analyzeSentence(sentence, step) {
  const text = sentence?.text || '';
  const lower = text.toLowerCase();
  const phrases = phraseGlossary
    .filter(([phrase]) => lower.includes(phrase))
    .slice(0, 6)
    .map(([phrase, meaning]) => ({ term: phrase, meaning, type: '표현' }));
  const words = commonWords
    .filter(([word]) => new RegExp(`\\b${word}\\b`, 'i').test(text))
    .slice(0, 6)
    .map(([term, meaning]) => ({ term, meaning, type: '단어' }));

  const structures = [];
  if (step?.patternKind === 'progressive') {
    const aux = lower.match(/\b(am|is|are|was|were|been)\b/)?.[0] || 'be';
    const ing = text.match(/\b[A-Za-z]+ing\b/)?.[0] || '동사-ing';
    structures.push({ label: '주어', value: extractSubject(text) });
    structures.push({ label: 'be/완료', value: aux });
    structures.push({ label: '진행 동작', value: ing });
    const time = lower.match(/\b(now|these days|lately|since [a-z]+|for \d+ minutes|all morning|earlier)\b/)?.[0];
    if (time) structures.push({ label: '시간감', value: time });
  } else {
    structures.push({ label: '주어', value: extractSubject(text) });
    structures.push({ label: '동사', value: extractVerb(text) });
    const linker = lower.match(/\b(when|before|after|as soon as|while|instead of)\b/)?.[0];
    if (linker) structures.push({ label: '연결어', value: linker });
    const frequency = lower.match(/\b(always|usually|often|sometimes|rarely|never|every [a-z]+|on weekends)\b/)?.[0];
    if (frequency) structures.push({ label: '반복 신호', value: frequency });
  }

  return {
    chunks: chunkSentence(text),
    glossary: [...phrases, ...words].slice(0, 8),
    structures
  };
}

export function chunkSentence(text) {
  const withBreaks = String(text || '')
    .replace(/\s+\/\s+/g, ' / ')
    .replace(/\b(when|before|after|as soon as|while|because|instead of|without)\b/gi, ' / $1');
  return withBreaks
    .split('/')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function makeQuestion(sentence, step, index = 0) {
  const text = sentence?.text || '';
  if (step?.patternKind === 'progressive') {
    const templates = [
      'What are you doing these days?',
      'What were you doing earlier?',
      'Who are you talking to these days?',
      'What are you trying to do now?'
    ];
    return templates[index % templates.length];
  }
  const lower = text.toLowerCase();
  if (lower.includes('when')) return 'What do you usually do in that situation?';
  if (lower.includes('before')) return 'What do you usually do before that?';
  if (lower.includes('after')) return 'What do you usually do after a long day?';
  const templates = [
    'What do you do every day?',
    'What do you usually do on weekends?',
    'What do you always do when you are busy?',
    'What do you prefer doing?'
  ];
  return templates[index % templates.length];
}

export function chooseNextSentence(sentences, progress, currentIndex = 0) {
  if (!sentences.length) return 0;
  const ranked = sentences
    .map((sentence, index) => ({
      index,
      reps: progress[sentence.id]?.reps || 0,
      speaks: progress[sentence.id]?.speaks || 0,
      score: progress[sentence.id]?.bestScore || 0
    }))
    .sort((a, b) => a.reps + a.speaks + a.score * 2 - (b.reps + b.speaks + b.score * 2));
  const next = ranked.find((item) => item.index !== currentIndex);
  return next?.index ?? (currentIndex + 1) % sentences.length;
}

export function speakText(text, lang = 'en-US') {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.86;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function extractSubject(text) {
  return text.match(/^[A-Za-z']+/)?.[0] || '주어';
}

function extractVerb(text) {
  const tokens = normalizeAnswer(text).split(' ');
  if (tokens[0] === 'i') return tokens[1] || '동사';
  if (['she', 'he', 'we', 'they', 'you'].includes(tokens[0])) return tokens[1] || '동사';
  return tokens.find((token) => token.length > 2) || '동사';
}
