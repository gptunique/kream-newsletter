# Render.com 배포 가이드

이 문서는 KREAM 스니커즈 랭킹 뉴스레터 시스템을 Render.com에 배포하는 방법을 설명합니다.

## 📋 사전 준비

- [Render.com](https://render.com) 계정
- GitHub 저장소 (https://github.com/gptunique/kream-newsletter)
- 환경 변수 값 (DATABASE_URL, JWT_SECRET 등)

---

## 🚀 배포 단계

### 1. Render.com 대시보드 접속

1. [Render.com](https://render.com)에 로그인
2. **"New +"** 버튼 클릭
3. **"Web Service"** 선택

### 2. GitHub 저장소 연결

1. **"Connect a repository"** 섹션에서
2. **"Configure account"** 클릭 (처음 사용 시)
3. GitHub 계정 인증 및 저장소 접근 권한 부여
4. **"gptunique/kream-newsletter"** 저장소 선택

### 3. 서비스 설정

다음 설정을 입력하세요:

| 항목 | 값 |
|------|-----|
| **Name** | `kream-newsletter` |
| **Region** | `Singapore (Southeast Asia)` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `bash scripts/render-build.sh` |
| **Start Command** | `pnpm start` |
| **Instance Type** | `Starter ($7/month)` 또는 `Free` |

### 4. 환경 변수 설정

**"Environment"** 탭에서 다음 환경 변수를 추가하세요:

#### 필수 환경 변수

```bash
# Node.js 환경
NODE_ENV=production
PORT=3000

# 데이터베이스 (Render PostgreSQL 또는 외부 MySQL)
DATABASE_URL=mysql://user:password@host:3306/database

# JWT 인증
JWT_SECRET=your-super-secret-jwt-key-here

# OAuth (Manus 플랫폼)
OAUTH_SERVER_URL=https://api.manus.im
VITE_APP_ID=your-app-id
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# 소유자 정보
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=your-name

# Manus API
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

#### 선택 환경 변수

```bash
# 애플리케이션 메타데이터
VITE_APP_TITLE=KREAM 스니커즈 랭킹
VITE_APP_LOGO=

# 분석 (선택)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

### 5. 데이터베이스 설정

#### 옵션 A: Render PostgreSQL 사용 (권장)

1. Render 대시보드에서 **"New +"** → **"PostgreSQL"** 클릭
2. 데이터베이스 이름: `kream-newsletter-db`
3. Region: `Singapore`
4. Plan: `Free` 또는 `Starter`
5. 생성 후 **"Internal Database URL"** 복사
6. Web Service의 환경 변수 `DATABASE_URL`에 붙여넣기

**주의:** PostgreSQL을 사용하려면 코드를 수정해야 합니다. (drizzle-orm 설정)

#### 옵션 B: 외부 MySQL 사용

Railway의 MySQL 데이터베이스를 계속 사용하거나, PlanetScale, AWS RDS 등 외부 MySQL을 사용할 수 있습니다.

**Railway MySQL 연결 정보:**
- Host: Railway 대시보드에서 확인
- Port: 3306
- Database: railway
- User: root
- Password: Railway 대시보드에서 확인

**DATABASE_URL 형식:**
```
mysql://user:password@host:3306/database
```

### 6. 배포 시작

1. **"Create Web Service"** 버튼 클릭
2. Render가 자동으로 빌드 및 배포 시작
3. 빌드 로그 확인:
   - `📦 Installing Node.js dependencies...`
   - `🌐 Installing Playwright Chromium browser...`
   - `🔨 Building application...`
   - `✅ Build completed successfully!`

### 7. 배포 완료 확인

1. 배포가 완료되면 Render가 제공하는 URL 확인 (예: `https://kream-newsletter.onrender.com`)
2. 웹사이트 접속 테스트
3. "Mock 데이터로 시작하기" 버튼 클릭
4. 제품 목록이 정상적으로 표시되는지 확인

---

## 🔧 문제 해결

### 빌드 실패

**증상:** Playwright 설치 중 에러 발생

**해결:**
```bash
# Build Command를 다음으로 변경
pnpm install && pnpm playwright install --with-deps chromium && pnpm run build
```

### 데이터베이스 연결 실패

**증상:** "Database not available" 에러

**해결:**
1. `DATABASE_URL` 환경 변수가 올바르게 설정되었는지 확인
2. 데이터베이스가 실행 중인지 확인
3. 방화벽 규칙 확인 (Render IP 허용)

### 스크래핑 실패

**증상:** "Browser not found" 에러

**해결:**
1. Build Command에 `--with-deps` 플래그가 포함되어 있는지 확인
2. Instance Type을 `Starter` 이상으로 업그레이드 (Free tier는 메모리 부족 가능)

---

## 📊 성능 최적화

### 권장 Instance Type

- **Free**: 테스트용 (메모리 512MB, 스크래핑 불안정)
- **Starter ($7/month)**: 프로덕션 권장 (메모리 512MB, 안정적)
- **Standard ($25/month)**: 대용량 트래픽 (메모리 2GB)

### 스크래핑 성능

- Render.com은 Playwright를 완벽하게 지원합니다
- 브라우저 풀(Browser Pool)을 사용하여 성능 최적화됨
- 예상 스크래핑 시간: 20-30초 (TOP 30 제품)

---

## 🔄 자동 배포

GitHub의 `main` 브랜치에 푸시하면 Render가 자동으로 재배포합니다.

```bash
git add .
git commit -m "Update feature"
git push origin main
```

---

## 📝 추가 설정

### 커스텀 도메인

1. Render 대시보드에서 서비스 선택
2. **"Settings"** 탭 → **"Custom Domain"** 섹션
3. 도메인 추가 및 DNS 설정

### 환경 변수 업데이트

1. Render 대시보드에서 서비스 선택
2. **"Environment"** 탭
3. 변수 추가/수정 후 **"Save Changes"**
4. 자동으로 재배포됨

---

## 🆘 지원

문제가 발생하면:
- [Render 공식 문서](https://render.com/docs)
- [Playwright 문서](https://playwright.dev)
- GitHub Issues: https://github.com/gptunique/kream-newsletter/issues
