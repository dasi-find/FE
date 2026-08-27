# 다시찾음 Frontend

다시찾음의 사용자 웹 서비스입니다.

## 기술 스택

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- Axios
- React Hook Form, Zod
- Vitest, Testing Library

## 개발 환경

- Node.js 22
- npm

Node Version Manager를 사용하는 경우 저장소의 `.nvmrc`로 Node.js 버전을 맞출 수 있습니다.

```bash
nvm use
```

## 실행 방법

```bash
npm install
cp .env.example .env.local
npm run dev
```

기본 개발 서버는 `http://localhost:5173`에서 실행됩니다.

## 환경변수

| 이름                     | 설명                   | 로컬 예시                   |
| ------------------------ | ---------------------- | --------------------------- |
| `VITE_API_BASE_URL`      | Backend API Base URL   | `http://localhost:8080/api` |
| `VITE_KAKAO_MAP_APP_KEY` | 카카오맵 JavaScript 키 | 카카오 Developers 앱 키     |

실제 환경변수는 `.env.local`에 작성하고 Git에 커밋하지 않습니다.

## Vercel 배포

운영 배포는 Vercel에서 아래와 같이 설정합니다.

| 항목              | 값                            |
| ----------------- | ----------------------------- |
| Production Branch | `main`                        |
| Framework Preset  | `Vite`                        |
| Root Directory    | `./`                          |
| Install Command   | `npm install`                 |
| Build Command     | `npm run build`               |
| Output Directory  | `dist`                        |
| 운영 도메인       | `https://dasifind.vercel.app` |
| Backend API URL   | `/api`                        |

Vercel의 Production 환경변수에 다음 값을 등록합니다.

```text
VITE_API_BASE_URL=/api
VITE_KAKAO_MAP_APP_KEY=카카오_JavaScript_키
```

로컬 `.env` 파일은 Vercel에 자동 반영되지 않습니다. Vercel 환경변수를 변경하면
새 배포를 실행해야 합니다.

`vercel.json`은 `/api/:path*` 요청을 EC2 백엔드로 전달합니다. 브라우저는
Vercel의 HTTPS 주소만 호출하므로 HTTP 백엔드 직접 호출로 인한 mixed content를
피할 수 있습니다. API rewrite는 React Router의 SPA fallback보다 먼저 적용합니다.

## 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 타입 검사 및 배포 빌드
npm run lint         # ESLint
npm run format       # Prettier 자동 포맷
npm run format:check # Prettier 포맷 검사
npm run test         # 테스트 1회 실행
npm run test:watch   # 테스트 Watch 모드
npm run preview      # 배포 빌드 미리보기
```

## 디렉터리 구조

```text
src/
├── api/          # API Client 및 요청 함수
├── app/          # Router, Provider 등 앱 초기 구성
├── assets/       # 이미지, 폰트 등 정적 파일
├── components/   # 공통 UI 컴포넌트
├── features/     # 기능 단위 코드
├── hooks/        # 공통 React Hook
├── pages/        # Route 단위 페이지
├── styles/       # 전역 스타일
├── test/         # 테스트 공통 설정
└── types/        # 공통 TypeScript 타입
```

빈 디렉터리는 필요한 기능을 구현할 때 생성합니다.

## Git Flow

모든 작업은 Issue 생성 후 `develop`에서 작업 브랜치를 생성해 진행합니다.

```text
feat/{Issue 번호}-{작업 내용} → develop → main → Vercel Production
```

작업 브랜치가 `develop`에 병합되고 필수 FE CI가 성공하면 검증된 커밋이
`main`에 자동으로 반영됩니다. Vercel은 `main` 변경을 `dasifind.vercel.app` 운영 환경에
자동 배포합니다. CI가 실패하거나 두 브랜치가 분기되면 운영 반영은 중단됩니다.

자세한 규칙은 Organization의 `.github/CONVENTION.md`를 확인해 주세요.
