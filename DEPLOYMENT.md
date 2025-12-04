# Vercel 배포 가이드

이 문서는 KREAM 스니커즈 랭킹 시스템을 Vercel에 배포하는 방법을 안내합니다.

## ⚠️ 중요 사항

**이 프로젝트는 Vercel에 직접 배포할 수 없습니다.** 다음 이유로 인해 Vercel 배포가 제한됩니다:

1. **서버리스 함수 제약**: Vercel은 서버리스 함수(Serverless Functions)만 지원하며, 최대 실행 시간이 10초(무료) ~ 60초(Pro)로 제한됩니다. 이 프로젝트의 Playwright 스크래핑은 20-30초 이상 소요되어 타임아웃이 발생합니다.

2. **백그라운드 작업 불가**: Vercel은 지속적인 백그라운드 프로세스를 지원하지 않습니다. 이 프로젝트는 Node.js 스케줄러(`node-cron`)를 사용하여 매일 자동 스크래핑을 실행하는데, Vercel에서는 이러한 장기 실행 프로세스가 불가능합니다.

3. **Playwright 브라우저 제약**: Vercel의 서버리스 환경에서 Playwright의 Chromium 브라우저를 실행하는 것은 메모리 및 실행 시간 제약으로 인해 매우 불안정합니다.

---

## 권장 배포 플랫폼

이 프로젝트는 **장기 실행 프로세스**와 **백그라운드 작업**이 필요하므로 다음 플랫폼을 권장합니다:

### 1. Manus 플랫폼 (현재 사용 중) ✅ **추천**

**장점:**
- 모든 환경 변수 자동 주입 (데이터베이스, OAuth, 스토리지)
- 백그라운드 스케줄러 완벽 지원
- Playwright 브라우저 실행 최적화
- 원클릭 배포 및 자동 SSL 인증서
- 무료 MySQL 데이터베이스 제공

**배포 방법:**
1. 우측 Management UI 상단의 **Publish** 버튼 클릭
2. 배포 완료 후 공개 URL 자동 생성
3. Settings → Domains에서 커스텀 도메인 연결 가능

---

### 2. Railway.app 🚂

**장점:**
- 장기 실행 프로세스 지원
- GitHub 연동 자동 배포
- 무료 플랜 제공 (월 $5 크레딧)
- PostgreSQL/MySQL 데이터베이스 제공

**배포 방법:**

1. **GitHub 저장소 생성**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/kream-newsletter.git
   git push -u origin main
   ```

2. **Railway 프로젝트 생성**
   - [Railway.app](https://railway.app) 접속 및 GitHub 로그인
   - "New Project" → "Deploy from GitHub repo" 선택
   - 저장소 선택

3. **환경 변수 설정**
   Railway 대시보드에서 다음 환경 변수를 추가합니다:
   ```
   DATABASE_URL=mysql://user:password@host:port/database
   JWT_SECRET=your-secret-key
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   VITE_APP_ID=your-app-id
   ```

4. **빌드 설정**
   Railway는 `package.json`의 `build` 스크립트를 자동 실행합니다.

---

### 3. Render.com 🎨

**장점:**
- 무료 플랜 제공
- 자동 SSL 인증서
- 백그라운드 워커 지원
- PostgreSQL 데이터베이스 무료 제공

**배포 방법:**

1. **Render 계정 생성**
   - [Render.com](https://render.com) 접속 및 가입

2. **Web Service 생성**
   - "New +" → "Web Service" 선택
   - GitHub 저장소 연결

3. **설정**
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Environment**: `Node`

4. **환경 변수 추가**
   Render 대시보드에서 Environment 탭에 환경 변수를 추가합니다.

---

### 4. DigitalOcean App Platform 🌊

**장점:**
- 프로덕션급 안정성
- 자동 스케일링
- 관리형 데이터베이스
- $200 무료 크레딧 (신규 가입)

**배포 방법:**

1. **DigitalOcean 계정 생성**
   - [DigitalOcean](https://www.digitalocean.com) 가입

2. **App 생성**
   - "Create" → "Apps" 선택
   - GitHub 저장소 연결

3. **설정**
   - **Build Command**: `pnpm install && pnpm build`
   - **Run Command**: `pnpm start`

---

### 5. VPS (Virtual Private Server) 💻

완전한 제어가 필요한 경우 VPS를 사용할 수 있습니다.

**추천 VPS 제공업체:**
- DigitalOcean Droplet ($6/월)
- Linode ($5/월)
- Vultr ($6/월)
- AWS EC2 (프리티어 12개월)

**배포 방법:**

1. **VPS 설정**
   ```bash
   # Node.js 설치
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # pnpm 설치
   npm install -g pnpm
   
   # MySQL 설치
   sudo apt-get install mysql-server
   ```

2. **프로젝트 클론**
   ```bash
   git clone https://github.com/your-username/kream-newsletter.git
   cd kream-newsletter
   pnpm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env
   nano .env  # 환경 변수 입력
   ```

4. **데이터베이스 마이그레이션**
   ```bash
   pnpm db:push
   ```

5. **PM2로 프로세스 관리**
   ```bash
   npm install -g pm2
   pm2 start pnpm --name kream-newsletter -- start
   pm2 save
   pm2 startup
   ```

6. **Nginx 리버스 프록시 설정**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Vercel 대안 아키텍처

Vercel을 꼭 사용하고 싶다면, 다음과 같이 아키텍처를 분리해야 합니다:

### 분리 아키텍처

1. **프론트엔드 (Vercel)**: React 클라이언트만 배포
2. **백엔드 (Railway/Render)**: Express + tRPC API 서버
3. **스크래핑 워커 (별도 서버)**: Playwright 스크래핑 전용

이 경우 프로젝트 구조를 대폭 수정해야 하며, 복잡도가 크게 증가합니다.

---

## 결론

**가장 간단한 배포 방법은 현재 사용 중인 Manus 플랫폼입니다.** 모든 인프라가 자동으로 설정되며, 백그라운드 작업과 스크래핑이 완벽하게 지원됩니다.

다른 플랫폼으로 이전하려면 Railway 또는 Render를 추천드립니다. 두 플랫폼 모두 무료 플랜을 제공하며, 이 프로젝트의 요구사항을 충족합니다.

---

## 추가 지원

배포 과정에서 문제가 발생하면 다음을 확인하세요:

1. **환경 변수**: 모든 필수 환경 변수가 올바르게 설정되었는지 확인
2. **데이터베이스 연결**: DATABASE_URL이 올바른지 확인
3. **포트 설정**: 대부분의 플랫폼은 `PORT` 환경 변수를 자동 주입하므로 `process.env.PORT`를 사용
4. **빌드 로그**: 배포 실패 시 빌드 로그를 확인하여 오류 원인 파악
