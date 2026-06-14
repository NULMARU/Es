# Beginner English Pattern Lab

초보자 영어회화 패턴 반복 학습 웹앱입니다. 프로젝트 폴더의 `스텝{n}_1.pdf`, `스텝{n}_2.pdf` 쌍을 홀수/짝수 페이지로 병합하고, 번호가 붙은 핵심 연습문장 1~50번을 학습 루프로 구성합니다.

## 실행

```powershell
npm install
npm run materials
npm run build
npm run preview
```

브라우저에서 `http://127.0.0.1:8787`을 엽니다.

개발 모드는 다음 명령을 사용합니다.

```powershell
npm run dev
```

## Gemini API 키 추가

1. Google AI Studio API Keys 페이지를 엽니다: https://aistudio.google.com/app/apikey
2. Google 계정으로 로그인합니다.
3. `Create API key`를 눌러 키를 생성하고 복사합니다.
4. `.env.example`을 참고해 프로젝트 루트에 `.env.local` 파일을 만들고 아래처럼 넣습니다.

```env
GEMINI_API_KEY=복사한_API_키
```

5. 서버를 다시 시작합니다.

```powershell
npm run build
npm run preview
```

PowerShell에서 임시로만 설정하려면 다음 방식도 가능합니다.

```powershell
$env:GEMINI_API_KEY="복사한_API_키"
npm run dev
```

키는 `.env`/`.env.local`에만 넣고 GitHub에 커밋하지 않습니다.

## 자료 추가

새 회차를 추가할 때는 프로젝트 루트에 다음 이름으로 PDF를 넣습니다.

```text
스텝3_1.pdf
스텝3_2.pdf
```

그 다음 자료를 다시 생성합니다.

```powershell
npm run materials
```

## 검증

```powershell
npm run validate
npm run build
npm run smoke
```
