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

앱의 `원본 병합` 영역에서 `PDF 추가`를 눌러 새 회차 PDF를 선택합니다.

```text
스텝3_1.pdf
스텝3_2.pdf
```

업로드가 끝나면 서버가 자료를 다시 생성하고 앱 화면에 바로 반영합니다. 프로젝트 루트에 PDF를 직접 넣은 경우에도 앱을 새로고침하거나 자료 새로고침 버튼을 누르면 변경된 PDF를 감지해 다시 생성합니다.

명령어로 직접 갱신할 수도 있습니다.

```powershell
npm run materials
```

한국어 프롬프트 OCR에는 Tesseract와 한국어 언어팩이 필요합니다. macOS에서는 한 번만 설치하면 됩니다.

```bash
brew install tesseract tesseract-lang
```

## 검증

```powershell
npm run validate
npm run build
npm run smoke
```

## GitHub Pages 배포

이 앱은 Vite 정적 빌드가 필요하므로 GitHub Pages 설정에서 `Deploy from a branch`의 `main / (root)`를 사용하지 않습니다. 저장소 설정의 Pages 화면에서 Source를 `GitHub Actions`로 선택합니다.

배포 워크플로는 `.github/workflows/pages.yml`에 있으며, `main` 브랜치에 푸시되면 `npm run build:pages`로 `/Es/` 경로에 맞춘 정적 앱을 배포합니다.

GitHub Pages는 Node/Express 서버를 실행하지 못합니다. 따라서 Pages 배포본에서는 학습 화면과 원본 자료 뷰어는 동작하지만, Gemini Live Translate 토큰 발급 API는 별도 백엔드가 있어야 활성화됩니다.
