export const workflows = [
  { id: 'understand', label: '이해하기' },
  { id: 'pattern', label: '패턴 익히기' },
  { id: 'make', label: '문장 만들기' },
  { id: 'speak', label: '소리내어 말하기' },
  { id: 'answer', label: '질문에 대답하기' }
];

const vocabularyCatalog = [
  ['stock up', '미리 넉넉히 사 두다', 'I stock up on tissues before winter.'],
  ['put on', '바르다, 착용하다', 'I put on sunscreen before I go out.'],
  ['sunscreen', '선크림', 'Sunscreen protects your skin.'],
  ['makeup', '화장', 'I do not wear makeup today.'],
  ['sleep late', '늦잠을 자다', 'I sleep late on Sundays.'],
  ['crave', '간절히 먹고 싶다', 'I crave something sweet after lunch.'],
  ['seriously', '진지하게, 정말로', 'I seriously need to think about this.'],
  ['as soon as', '하자마자', 'I call her as soon as I arrive.'],
  ['fall asleep', '잠들다', 'I fall asleep quickly after work.'],
  ['unknown', '알 수 없는, 모르는', 'I do not answer unknown numbers.'],
  ['spam', '스팸, 원치 않는 메시지', 'That text looks like spam.'],
  ['regret', '후회하다', 'I regret eating too much.'],
  ['get paid', '월급을 받다', 'I buy shoes after I get paid.'],
  ['try on', '입어 보다', 'I try on jackets before buying them.'],
  ['remove makeup', '화장을 지우다', 'I remove makeup before bed.'],
  ['share', '공유하다', 'I share good places with friends.'],
  ['delivery', '배달', 'I order delivery on busy days.'],
  ['skip breakfast', '아침을 거르다', 'I often skip breakfast.'],
  ['license', '면허', 'I have a driver license.'],
  ['scared of', '무서워하는', 'I am scared of driving at night.'],
  ['nervous', '불안한, 긴장한', 'I feel nervous before tests.'],
  ['sheet mask', '시트 마스크', 'I use a sheet mask at night.'],
  ['work dinner', '회식', 'I took a taxi after a work dinner.'],
  ['crowded', '붐비는', 'The subway is crowded.'],
  ['get stressed', '스트레스를 받다', 'I get stressed when plans change.'],
  ['run out', '다 떨어지다', 'We ran out of coffee.'],
  ['cosmetics', '화장품', 'I order cosmetics online.'],
  ['check reviews', '후기를 확인하다', 'I check reviews before booking.'],
  ['comfortable', '편안한', 'These shoes are comfortable.'],
  ['change into', '갈아입다', 'I change into pajamas at home.'],
  ['wake up', '일어나다, 잠에서 깨다', 'I check my phone when I wake up.'],
  ['get grumpy', '예민해지다', 'I get grumpy when I am hungry.'],
  ['impatient', '조급한', 'I get impatient in long lines.'],
  ['go as planned', '계획대로 되다', 'Things did not go as planned.'],
  ['fine dust', '미세먼지', 'Fine dust is bad today.'],
  ['stand by the door', '문 옆에 서다', 'I stand by the door on the subway.'],
  ['clear my head', '머리를 식히다', 'A short walk helps me clear my head.'],
  ['quiet time', '조용한 시간', 'I need quiet time after work.'],
  ['focus', '집중하다', 'I cannot focus in a messy room.'],
  ['messy', '지저분한', 'My room is messy.'],
  ['sing along', '따라 부르다', 'I sing along to my favorite song.'],
  ['comes on', '노래나 영상이 나오다', 'When this song comes on, I smile.'],
  ['stiff', '뻐근한', 'My shoulders feel stiff.'],
  ['stuffy', '답답한, 환기가 안 되는', 'This room feels stuffy.'],
  ['reply to', '답장하다', 'I reply to emails quickly.'],
  ['go straight', '곧장 가다', 'I go straight home after class.'],
  ['prefer', '더 좋아하다, 선호하다', 'I prefer tea instead of coffee.'],
  ['instead of', '대신에', 'I walk instead of taking a bus.'],
  ['notification', '알림', 'I turn off notifications at work.'],
  ['these days', '요즘', 'I am busy these days.'],
  ['take a shower', '샤워하다', 'I was taking a shower.'],
  ['heading', '가는 중인, 향하는', 'Where are you heading?'],
  ['stay up late', '늦게까지 깨어 있다', 'They stay up late on Fridays.'],
  ['serious', '심각한, 진지한', 'You looked serious yesterday.'],
  ['get ready for bed', '잘 준비를 하다', 'I get ready for bed at eleven.'],
  ['reply', '답장하다', 'I could not reply right away.'],
  ['all night', '밤새', 'He studied all night.'],
  ['performance', '공연, 발표', 'She practiced for a performance.'],
  ['rethink', '다시 생각하다', 'I need to rethink my plan.'],
  ['their own thing', '각자 자기 일', 'Everyone was doing their own thing.'],
  ['gather my thoughts', '생각을 정리하다', 'Give me a second to gather my thoughts.'],
  ['wonder', '궁금해하다', 'I was wondering what you meant.'],
  ['setting', '해가 지는 중인', 'The sun is setting.'],
  ['snowing', '눈이 오는 중인', 'It is snowing hard.'],
  ['conversation', '대화', 'We had an important conversation.'],
  ['puffer jacket', '패딩 점퍼', 'I should take out my puffer jacket.'],
  ['explain', '설명하다', 'I was explaining the rule.'],
  ['zoning out', '멍때리다', 'I was zoning out for a moment.'],
  ['lying around', '빈둥거리다', 'I am lying around at home.'],
  ['package', '택배', 'My package arrived today.'],
  ['since yesterday', '어제부터', 'I have waited since yesterday.'],
  ['leaving me on read', '읽고 답하지 않다', 'She is leaving me on read again.'],
  ['avoid', '피하다', 'He is avoiding me lately.'],
  ['planning my day', '하루 계획을 세우다', 'I am planning my day now.'],
  ['scrolling through', '스크롤하며 보다', 'She was scrolling through photos.'],
  ['right moment', '적절한 순간', 'I am waiting for the right moment.'],
  ['deciding', '결정하는 중인', 'He is deciding what to order.'],
  ['getting into', '빠져들다', 'I am getting into this show.'],
  ['picking out', '고르다', 'I am picking out an outfit.'],
  ['outfit', '옷차림', 'This outfit is comfortable.'],
  ['looking for a seat', '자리를 찾다', 'I was looking for a seat.'],
  ['without telling anyone', '아무에게도 말하지 않고', 'He left without telling anyone.'],
  ['catching up on', '밀린 것을 따라잡다', 'I am catching up on messages.'],
  ['debating whether', '할지 말지 고민하다', 'I am debating whether to go.'],
  ['excuse', '핑계', 'That sounds like an excuse.'],
  ['impulse-buying', '충동구매하다', 'I am thinking about impulse-buying it.'],
  ['hiding under the covers', '이불 속에 숨어 있다', 'I was hiding under the covers.'],
  ['on my way home', '집에 가는 중인', 'I am on my way home.'],
  ['cheer myself up', '스스로 기분을 풀다', 'I watch a show to cheer myself up.'],
  ['rambling on', '두서없이 계속 말하다', 'He is rambling on again.'],
  ['believe', '믿다', 'I believed what you said.'],
  ['stick to', '계획이나 약속을 지키다', 'I did not stick to my plan.'],
  ['gave up on', '포기했다', 'I gave up on my diet.'],
  ['give up on', '포기하다', 'I gave up on my diet.'],
  ['solve', '해결하다', 'I solved the problem yesterday.'],
  ['used to', '예전에 자주 ~하곤 했다', 'I used to go there often.'],
  ['in the mood', '그럴 기분인', 'I was not in the mood to talk.'],
  ['came across', '우연히 발견했다', 'I came across old photos.'],
  ['come across', '우연히 발견하다', 'I came across old photos.'],
  ['came up with', '생각해 냈다', 'I came up with a good idea.'],
  ['come up with', '생각해 내다', 'I came up with a good idea.'],
  ['opportunity', '기회', 'I missed a good opportunity.'],
  ['reject', '거절하다', 'I rejected the offer.'],
  ['fell asleep', '잠들었다', 'I fell asleep while watching TV.'],
  ['fall asleep', '잠들다', 'I fell asleep while watching TV.'],
  ['hang up', '전화를 끊다', 'I hung up the phone first.'],
  ['misunderstand', '오해하다', 'I misunderstood what you said.'],
  ['clear out', '정리해서 비우다', 'I cleared out old emails.'],
  ['deep clean', '대청소하다', 'I gave my room a deep clean.'],
  ['submit', '제출하다', 'I submitted the report.'],
  ['deadline', '마감일', 'I finished it before the deadline.'],
  ['bump into', '우연히 만나다', 'I bumped into an old friend.'],
  ['lighten the mood', '분위기를 풀다', 'I made a joke to lighten the mood.'],
  ['frustrated', '답답하고 좌절한', 'I got frustrated after the meeting.'],
  ['flustered', '당황한', 'I was flustered when I saw him.'],
  ['exhausted', '완전히 지친', 'I was exhausted after my workout.'],
  ['worth it', '그럴 가치가 있는', 'The trip was worth it.'],
  ['annoyed', '짜증 난', 'I got annoyed when I heard the news.'],
  ['confused', '혼란스러운', 'I was confused after the explanation.'],
  ['atmosphere', '분위기', 'The atmosphere was heavy.'],
  ['open up', '속마음을 털어놓다', 'I opened up about my feelings.'],
  ['feel blue', '우울하다', 'I felt blue on rainy days.'],
  ['accommodation', '숙소', 'The accommodation was comfortable.'],
  ['emotional', '감정이 북받친', 'I got emotional during the movie.'],
  ['nostalgic', '추억에 잠긴', 'I got nostalgic when I heard the song.'],
  ['embarrassed', '창피한, 당황스러운', 'I was embarrassed in front of everyone.'],
  ['worn out', '완전히 지친', 'We were worn out after the trip.']
].map(([term, meaning, example]) => ({
  term,
  meaning,
  example,
  type: term.includes(' ') || term.includes('-') ? '표현' : '단어'
}));

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
  const glossary = vocabularyCatalog
    .filter((item) => matchesVocabulary(text, item.term))
    .slice(0, 3);

  const structures = [];
  if (step?.patternKind === 'progressive') {
    const aux = lower.match(/\b(am|is|are|was|were|been)\b/)?.[0] || 'be';
    const ing = text.match(/\b[A-Za-z]+ing\b/)?.[0] || '동사-ing';
    structures.push({ label: '주어', value: extractSubject(text) });
    structures.push({ label: 'be/완료', value: aux });
    structures.push({ label: '진행 동작', value: ing });
    const time = lower.match(/\b(now|these days|lately|since [a-z]+|for \d+ minutes|all morning|earlier)\b/)?.[0];
    if (time) structures.push({ label: '시간감', value: time });
  } else if (step?.patternKind === 'past-simple') {
    structures.push({ label: '주어', value: extractSubject(text) });
    const pastVerb = lower.includes("didn't")
      ? "didn't + 동사원형"
      : text.match(/\b[A-Za-z]+ed\b/)?.[0] || lower.match(/\b(was|were|went|came|got|felt|made|took|gave|hung|forgot|misunderstood)\b/)?.[0] || '과거 동사';
    structures.push({ label: '과거 동작', value: pastVerb });
    const time = lower.match(/\b(yesterday|last [a-z]+|ago|when i was young|before|after)\b/)?.[0];
    if (time) structures.push({ label: '과거 신호', value: time });
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
    glossary,
    structures
  };
}

function matchesVocabulary(text, term) {
  const lowerText = String(text || '').toLowerCase();
  const lowerTerm = term.toLowerCase();
  if (lowerTerm.includes(' ') || lowerTerm.includes('-')) {
    return lowerText.includes(lowerTerm);
  }
  const suffixes = lowerTerm.endsWith('e') ? '(s|d|ing)?' : '(s|ed|ing)?';
  return new RegExp(`\\b${escapeRegExp(lowerTerm)}${suffixes}\\b`, 'i').test(text);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

export function makeAnswerQuestions(step) {
  if (step?.patternKind === 'progressive') {
    return [
      'What are you doing these days for your health?',
      'Who are you talking to often these days?',
      'What are you waiting for now?',
      'What are you thinking about these days?',
      'What were you doing around 11 PM yesterday?',
      'What were you doing when someone called you recently?',
      'What are you planning now?',
      'What are you getting into these days?',
      'What are you trying to do to cheer yourself up?',
      'What are you deciding or debating right now?'
    ];
  }

  if (step?.patternKind === 'past-simple') {
    return [
      'What did you believe recently?',
      'What did you change because of the weather?',
      'What plan did you fail to stick to?',
      'What did you give up on because of stress?',
      'What problem did you solve recently?',
      'Where did you use to go often?',
      'What did you try after seeing it online?',
      'What old thing did you come across recently?',
      'When were you really nervous or shocked?',
      'What experience was worth it even though it was tough?'
    ];
  }

  return [
    'What do you usually do when you get home?',
    'What do you do before you fall asleep?',
    'What do you usually do after lunch?',
    'What do you do when you feel tired or stressed?',
    'What do you usually do on weekends?',
    'What do you do when the weather is bad?',
    'What do you do before you buy something?',
    'What do you prefer doing after work or school?',
    'What do you always do when you have important work?',
    'What do you do when you travel?'
  ];
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
