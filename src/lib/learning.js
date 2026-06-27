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
  ['worn out', '완전히 지친', 'We were worn out after the trip.'],
  ['get done', '끝내다, 처리하다', 'I will get the report done tonight.'],
  ['hang out', '시간을 보내다, 어울리다', 'I am hanging out with friends.'],
  ['catch up', '밀린 이야기를 나누다, 따라잡다', 'We need to catch up soon.'],
  ['sign up for', '등록하다', 'I am going to sign up for the gym.'],
  ['grab the check', '계산서를 집어 계산하다', 'I will grab the check.'],
  ['break down', '고장 나다', 'My car keeps breaking down.'],
  ['show up', '나타나다, 도착하다', 'He will show up late.'],
  ['hear out', '끝까지 들어주다', 'I will hear you out.'],
  ['traveling abroad', '해외여행을 가는 중/예정', 'I am traveling abroad next month.'],
  ['clean up', '청소하다, 정리하다', 'I am going to clean up the house.'],
  ['warm up', '따뜻해지다', 'It is going to warm up soon.'],
  ['go hiking', '등산/하이킹을 가다', 'We will go hiking this weekend.'],
  ['hard time', '힘든 시간', 'You must be having a hard time.'],
  ['help out', '도와주다', 'I will help you out.'],
  ['look for', '찾다', 'I am going to look for a new job.'],
  ['pay better', '보수가 더 좋다', 'This job pays better.'],
  ['good feeling', '좋은 예감', 'I have a good feeling.'],
  ['hit the gym', '헬스장에 가다', 'I am going to hit the gym.'],
  ['stay up late', '늦게까지 깨어 있다', 'I am going to stay up late.'],
  ['get my hair done', '머리를 하다', 'I am going to get my hair done.']
].map(([term, meaning, example]) => ({
  term,
  meaning,
  example,
  type: term.includes(' ') || term.includes('-') ? '표현' : '단어'
}));

const fallbackVocabularyMeanings = new Map([
  ['has a sale', '세일하다'],
  ['like that', '~라는 점을 좋아하다'],
  ['something sweet', '단것'],
  ['what to eat', '무엇을 먹을지'],
  ['like going to', '~에 가는 것을 좋아하다'],
  ['restaurants people say are good', '사람들이 좋다고 하는 식당'],
  ['wash my hands', '손을 씻다'],
  ['go out', '밖에 나가다'],
  ['take lots of photos', '사진을 많이 찍다'],
  ['travel', '여행하다'],
  ["can't sleep well", '잠을 잘 못 자다'],
  ['drink beer', '맥주를 마시다'],
  ['watch tv shows', '드라마나 TV 프로그램을 보다'],
  ['take a taxi', '택시를 타다'],
  ['get tired', '피곤해지다'],
  ['plans change', '계획이 바뀌다'],
  ['get home', '집에 오다'],
  ['go outside', '밖에 나가다'],
  ['it rains', '비가 오다'],
  ['wear a mask', '마스크를 쓰다'],
  ['get off', '내리다'],
  ['stretch', '스트레칭하다'],
  ['body feels stiff', '몸이 뻐근하다'],
  ['open the window', '창문을 열다'],
  ['room feels stuffy', '방이 답답하다'],
  ['do important work', '중요한 일을 하다'],
  ["couldn't answer", '받을 수 없었다'],
  ['talking on the phone', '전화로 이야기하는 중'],
  ['look serious', '심각해 보이다'],
  ['getting ready for bed', '잘 준비를 하는 중'],
  ['laughing', '웃고 있는 중'],
  ['something funny', '재미있는 것'],
  ['not talking', '말하지 않는 중'],
  ['studying', '공부하는 중'],
  ['practicing guitar', '기타를 연습하는 중'],
  ['for performance', '공연을 위해'],
  ['what you said', '네가 한 말'],
  ['gathering my thoughts', '생각을 정리하는 중'],
  ['what to do', '무엇을 할지'],
  ['battery died', '배터리가 꺼졌다'],
  ['important conversation', '중요한 대화'],
  ['having a meeting', '회의 중'],
  ['weather getting colder', '날씨가 추워지는 중'],
  ['need puffer jacket', '패딩 점퍼가 필요하다'],
  ['something important', '중요한 것'],
  ['no one', '아무도'],
  ['listening', '듣는 중'],
  ['waiting for you', '너를 기다리는 중'],
  ['getting prettier', '점점 예뻐지는 중'],
  ['walk in', '걸어 들어오다'],
  ['making excuses', '핑계를 대는 중'],
  ['laugh', '웃다'],
  ['birthday messages', '생일 메시지'],
  ['loud music', '큰 음악 소리'],
  ['friends', '친구들'],
  ['messages', '메시지들'],
  ['movie', '영화'],
  ['phone', '전화, 휴대폰'],
  ['meeting', '회의'],
  ['weather', '날씨'],
  ['problem', '문제'],
  ['report', '보고서'],
  ['details', '세부 사항']
]);

const fallbackStopwords = new Set([
  'a',
  'about',
  'after',
  'again',
  'all',
  'always',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'before',
  'but',
  'by',
  'can',
  "can't",
  'could',
  "couldn't",
  'did',
  "didn't",
  'do',
  "don't",
  'for',
  'from',
  'get',
  'go',
  'had',
  'has',
  'have',
  'he',
  "he's",
  'her',
  'him',
  'i',
  "i'll",
  "i'm",
  'if',
  'in',
  'is',
  'it',
  "it's",
  'me',
  'my',
  'no',
  'not',
  'now',
  'of',
  'on',
  'or',
  'out',
  'she',
  "she's",
  'so',
  'some',
  'that',
  'the',
  'them',
  'there',
  'they',
  "they're",
  'this',
  'to',
  'too',
  'up',
  'was',
  'we',
  "we're",
  'were',
  'what',
  'when',
  'where',
  'while',
  'who',
  'why',
  'will',
  'with',
  'you',
  "you'll",
  "you're"
]);

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
  const glossary = selectSentenceVocabulary(sentence, text);

  const structures = [];
  if (step?.patternKind === 'mixed') {
    const tense = detectMixedTense(text);
    structures.push({ label: '시제 선택', value: tense.label });
    structures.push({ label: '주어', value: extractSubject(text) });
    structures.push({ label: tense.actionLabel, value: tense.action });
    if (tense.signal) structures.push({ label: '시간 신호', value: tense.signal });
  } else if (step?.patternKind === 'infinitive-gerund') {
    const toInfinitive = text.match(/\b(?:want|hope|plan|decide|need|try|learn|agree|offer|manage|like|would like)\s+(?:not\s+)?to\s+[A-Za-z]+\b/i)?.[0]
      || text.match(/\bhow\s+to\s+[A-Za-z]+\b/i)?.[0];
    const gerund = text.match(/\b(?:like|enjoy|love|hate|avoid|finish|miss|practice|deny|thinking about|thinking of)\s+[A-Za-z]+ing\b/i)?.[0];
    const relative = lower.match(/\b(who|that|where|what)\b/)?.[0];
    structures.push({ label: '주어', value: extractSubject(text) });
    structures.push({ label: '목적어 형태', value: toInfinitive ? 'to 부정사' : gerund ? '동명사' : 'to 부정사 / 동명사' });
    structures.push({ label: '핵심 덩어리', value: toInfinitive || gerund || extractVerb(text) });
    if (relative) structures.push({ label: '설명 연결', value: relative });
  } else if (step?.patternKind === 'progressive') {
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
  } else if (step?.patternKind === 'future') {
    structures.push({ label: '주어', value: extractSubject(text) });
    const futureForm = lower.includes('going to')
      ? 'be going to'
      : lower.includes("'ll") || lower.includes(' will ')
        ? 'will'
        : text.match(/\b(am|is|are|'m|'re|'s)\s+[A-Za-z]+ing\b/i)?.[0] || '미래 표현';
    structures.push({ label: '미래 표현', value: futureForm });
    const time = lower.match(/\b(tonight|tomorrow|later|soon|next [a-z]+|right after work)\b/)?.[0];
    if (time) structures.push({ label: '미래 신호', value: time });
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

function selectSentenceVocabulary(sentence, text) {
  const selected = [];
  const seen = new Set();
  const addItem = (item) => {
    if (!item?.term || selected.length >= 3) return;
    const key = item.term.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    selected.push(item);
  };

  vocabularyCatalog
    .filter((item) => matchesVocabulary(text, item.term))
    .forEach(addItem);

  const hints = Array.isArray(sentence?.hints) ? sentence.hints : [];
  const hintText = hints.join(' ');
  if (selected.length < 3 && hintText) {
    vocabularyCatalog
      .filter((item) => matchesVocabulary(hintText, item.term) || hintMatchesTerm(hintText, item.term))
      .forEach(addItem);
  }

  for (const hint of hints) {
    if (selected.length >= 3) break;
    addItem(makeFallbackVocabularyItem(hint, text));
  }

  for (const term of extractFallbackTerms(text)) {
    if (selected.length >= 2) break;
    addItem(makeFallbackVocabularyItem(term, text));
  }

  return selected.slice(0, 3);
}

function hintMatchesTerm(hintText, term) {
  const normalizedHint = normalizeFallbackTerm(hintText);
  const normalizedTerm = normalizeFallbackTerm(term);
  return normalizedHint.includes(normalizedTerm) || normalizedTerm.includes(normalizedHint);
}

function makeFallbackVocabularyItem(rawTerm, example) {
  const term = cleanupVocabularyTerm(rawTerm);
  if (!term) return null;
  const lower = term.toLowerCase();
  return {
    term,
    meaning: fallbackVocabularyMeanings.get(lower) || describeFallbackTerm(lower),
    example,
    type: term.includes(' ') || term.includes('-') ? '표현' : '단어'
  };
}

function cleanupVocabularyTerm(value) {
  const term = normalizeFallbackTerm(value)
    .replace(/\s+/g, ' ')
    .trim();
  if (!term || fallbackStopwords.has(term)) return '';
  if (term.length < 3) return '';
  return term;
}

function normalizeFallbackTerm(value) {
  return String(value || '')
    .replace(/\|/g, 'I')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[^A-Za-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function describeFallbackTerm(term) {
  if (term.endsWith('ing')) return '~하는 중이라는 뜻의 표현';
  if (term.includes('whether')) return '~할지 말지를 나타내는 표현';
  if (term.includes('because')) return '이유를 연결하는 표현';
  if (term.includes('before')) return '~하기 전을 나타내는 표현';
  if (term.includes('after')) return '~한 뒤를 나타내는 표현';
  if (term.includes('when')) return '~할 때를 나타내는 표현';
  if (term.includes('to ')) return '목적이나 방향을 나타내는 표현';
  return '문장에서 뜻을 만드는 핵심 표현';
}

function extractFallbackTerms(text) {
  const cleanText = String(text || '')
    .replace(/[()[\]{}.,?!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const lowerText = cleanText.toLowerCase();
  const phrasePatterns = [
    /\b(send birthday messages)\b/i,
    /\b(loud music)\b/i,
    /\b(go outside)\b/i,
    /\b(take a taxi)\b/i,
    /\b(watch tv shows)\b/i,
    /\b(drink beer)\b/i,
    /\b(having a meeting)\b/i,
    /\b(important conversation)\b/i,
    /\b(getting ready for bed)\b/i,
    /\b(gathering my thoughts)\b/i,
    /\b(what to do)\b/i,
    /\b(birthday messages)\b/i
  ];
  const phrases = phrasePatterns
    .map((pattern) => lowerText.match(pattern)?.[1])
    .filter(Boolean);
  const tokens = cleanText
    .split(/\s+/)
    .map((token) => token.replace(/^['"]|['"]$/g, '').toLowerCase())
    .filter((token) => /^[a-z][a-z'-]*$/.test(token))
    .filter((token) => !fallbackStopwords.has(token))
    .filter((token) => token.length > 3);
  return [...phrases, ...tokens];
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

function detectMixedTense(text) {
  const lower = String(text || '').toLowerCase();
  if (/\b(will|'ll|won't)\b/.test(lower)) {
    return {
      label: '미래 - will',
      actionLabel: '미래 동작',
      action: lower.includes("'ll") ? "will/'ll + 동사" : 'will + 동사',
      signal: lower.match(/\b(tonight|tomorrow|soon|later)\b/)?.[0] || ''
    };
  }
  if (/\bgoing to\b/.test(lower)) {
    return {
      label: '미래 - be going to',
      actionLabel: '계획',
      action: 'be going to + 동사',
      signal: lower.match(/\b(next [a-z]+|this weekend|tomorrow)\b/)?.[0] || ''
    };
  }
  if (/\b(am|is|are|was|were|'m|'re|'s)\s+[a-z]+ing\b/.test(lower)) {
    const isPast = /\b(was|were)\b/.test(lower);
    return {
      label: isPast ? '과거 진행형' : '진행형',
      actionLabel: '진행 동작',
      action: text.match(/\b[A-Za-z]+ing\b/)?.[0] || '동사-ing',
      signal: lower.match(/\b(right now|now|this week|last night|at [0-9]+)\b/)?.[0] || ''
    };
  }
  if (/\b(yesterday|last|ago|back then|gave|went|took|fell|lost|changed|chatted|believed|didn't)\b/.test(lower) || /\b[a-z]+ed\b/.test(lower)) {
    return {
      label: '과거 시제',
      actionLabel: '과거 동작',
      action: text.match(/\b[A-Za-z]+ed\b/)?.[0] || lower.match(/\b(gave|went|took|fell|lost|changed|believed|didn't)\b/)?.[0] || '과거 동사',
      signal: lower.match(/\b(yesterday|last [a-z]+|back then|last night)\b/)?.[0] || ''
    };
  }
  return {
    label: '현재 시제',
    actionLabel: '현재 동작',
    action: extractVerb(text),
    signal: lower.match(/\b(always|usually|often|sometimes|every [a-z]+|when)\b/)?.[0] || ''
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
  if (step?.patternKind === 'infinitive-gerund') {
    const templates = [
      'What do you want to try these days?',
      'What do you like doing in your free time?',
      'What are you trying to improve?',
      'What did you decide to do recently?'
    ];
    return templates[index % templates.length];
  }
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
  if (step?.patternKind === 'infinitive-gerund') {
    return [
      'What do you want to try these days?',
      'What do you need to fix or finish soon?',
      'What are you learning how to do?',
      'What do you like doing when you want to relax?',
      'What do you avoid doing when you are tired?',
      'What did you decide to do recently?',
      'What are you thinking about changing?',
      'What kind of place do you want to visit?',
      'Who do you like spending time with?',
      'What information are you trying to find?'
    ];
  }

  if (step?.patternKind === 'mixed') {
    return [
      'What do you usually do when you are stressed?',
      'What did you do last week?',
      'What are you doing right now?',
      'What will you do tonight?',
      'What are you going to do next month?',
      'What were you doing last night?',
      'What do you do every weekend?',
      'What did you give up on recently?',
      'What are you going to start next year?',
      'What good news do you think you will hear soon?'
    ];
  }

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

  if (step?.patternKind === 'future') {
    return [
      'What will you probably do later?',
      'What are you going to do tonight?',
      'Who are you meeting tomorrow?',
      'What are you going to sign up for?',
      'What will you help someone with?',
      'What are you going to clean up soon?',
      'Where are you traveling during your next vacation?',
      'What are you going to study or practice?',
      'What are you going to do right after work?',
      'What do you think is going to go well?'
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
