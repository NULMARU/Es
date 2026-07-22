# Es — Beginner English Pattern Lab

React+Vite 영어 패턴 학습 웹앱. PDF 교재를 OCR로 추출해 스텝별 학습 콘텐츠로 제공한다.

- 배포: https://nulmaru.github.io/Es/ (main 푸시 → GitHub Actions가 `build:pages`로 자동 배포)
- 데이터 흐름: `스텝N.pdf`(루트) → `npm run materials`(OCR) → `public/data/materials.json` + `public/materials/step-NN/` 이미지

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run materials` | PDF 전체 재-OCR (약 90초, .venv Python + tesseract 필요, **로컬 전용**) |
| `npm run dev` | vite(5173) + API 서버(8791) 동시 실행 |
| `npm run validate` | materials.json·이미지 정합성 검사 |
| `npm run smoke` | 헤드리스 Chrome 스모크 테스트 (`APP_URL=http://127.0.0.1:8791`로 서버 지정) |

포트 주의: 이 Mac에서 5173/8787/8788은 다른 프로젝트가 점유할 수 있음. API 기본 포트는 **8791**.

## 새 스텝(PDF) 추가 절차

1. `스텝N.pdf`(단일) 또는 `스텝N_1.pdf`+`스텝N_2.pdf`(짝) 를 루트에 놓는다. 단일 PDF는 홀수/짝수 페이지가 자동으로 part1/2로 분리된다.
2. `npm run materials` 실행 후 결과의 **patternKind·title·topic이 올바른지 반드시 확인**한다. PDF는 임베디드 텍스트가 없는 이미지 PDF라 OCR 오인식이 흔하다.
3. 새 문법 주제라면 `tools/build_materials.py`에 새 pattern kind를 추가한다 (아래 체크리스트).
4. `npm run validate` + 스모크/브라우저 확인 후 커밋·푸시.

## 새 pattern kind 추가 체크리스트

새 문법 주제가 기존 분류에 없으면 오분류된다(예: "현재완료"가 "현재" 매칭으로 present-simple 처리). **세 파일 모두** 수정해야 완전하다:

1. **`tools/build_materials.py`**
   - `detect_pattern_kind`: 키워드 + `step == N` 폴백. **더 구체적인 키워드를 위에** 둔다("현재완료진행" → "현재완료" → "진행" 순). 기존 스텝들의 OCR 텍스트와 키워드 충돌 여부를 materials.json의 oddText/evenText로 먼저 확인할 것.
   - `build_patterns`: 패턴 카드 3장 (name/formula/focus/signals)
   - `title_for_step`, `topic_for_step`: 제목·주제 (OCR 추출이 부정확하므로 하드코딩 권장)
2. **`src/lib/learning.js`**
   - `analyzeSentence`: 문장 구조 분해 분기
   - `makeQuestion`: 말하기 질문 템플릿 4개
   - `makeAnswerQuestions`: 답변 연습 질문 10개
3. **`src/App.jsx`**
   - `answerProfiles`: 질문 10개와 1:1 대응하는 프로필 10개 (context 정규식 / correction / contextHint)
   - `getGrammarIssues`: 해당 문법 형태 체크 분기

이 분기가 없으면 앱은 일반 폴백(present-simple 프로필 등)으로 동작은 한다.

**현재 kind 목록** — 파이프라인: present-simple, progressive, past-simple, future, mixed(5), infinitive-gerund(6), dummy-subject(7), there-is(8), present-perfect(9), present-perfect-progressive(10), relative-clause(11), indirect-question(12), modal(13).
⚠️ `relative-clause`와 `indirect-question`은 learning.js/App.jsx 분기가 아직 없어 일반 폴백으로 동작 중.

## Canonical sentences (OCR 교정 오버라이드)

OCR이 뽑은 문장이 틀리면 `build_materials.py`의 `CANONICAL_SENTENCES[step][exerciseNumber]`에 정답 문장을 넣어 덮어쓴다. OCR이 아예 놓친 번호는 `CANONICAL_PROMPTS`의 한국어 프롬프트·힌트와 함께 새로 추가된다. 스텝 4·5·6·12·13에 적용돼 있음.

## 기타 주의사항

- 정적 배포(Pages)에서는 PDF 업로드가 비활성화됨 — 자료 추가는 로컬에서만.
- TTS: ElevenLabs(`src/lib/tts.js`), localStorage에 API 키. 실패 시 Web Speech 폴백.
- 브라우저 오디오 검증 시 Chrome 탭이 hidden이면 오디오 로딩이 stall됨 — 창을 앞으로 가져온 뒤 테스트.
- 각 스텝은 6스프레드 · 50문장이 정상. `validate`가 45문장 미만이면 경고.
