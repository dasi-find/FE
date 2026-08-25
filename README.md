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

| 이름                | 설명                 | 로컬 예시                   |
| ------------------- | -------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend API Base URL | `http://localhost:8080/api` |

실제 환경변수는 `.env.local`에 작성하고 Git에 커밋하지 않습니다.

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
feat/{Issue 번호}-{작업 내용} → develop → main
```

자세한 규칙은 Organization의 `.github/CONVENTION.md`를 확인해 주세요.
