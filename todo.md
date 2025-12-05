# KREAM Newsletter TODO

## Phase 1: 데이터베이스 스키마 및 시드 데이터 구축
- [x] 데이터베이스 스키마 설계 (products, rankings, daily_snapshots 테이블)
- [x] 시드 데이터 파일 생성 (product_images.json)
- [x] 데이터베이스 마이그레이션 실행

## Phase 2: 백엔드 API 및 스크래핑 로직 구현
- [x] tRPC 프로시저 구현 (랭킹 조회, 제품 상세, 날짜별 랭킹)
- [x] Playwright 스크래핑 로직 구현 (Mock, Realtime, Popular 모드)
- [x] 스크래핑 트리거 API 구현
- [x] 데이터베이스 쿼리 헬퍼 함수 작성

## Phase 3: 프론트엔드 UI 및 뉴스레터 페이지 구현
- [x] 다크 테마 커러 팔레트 적용
- [x] 뉴스레터 메인 페이지 레이아웃 구현
- [x] 카드뷰 컴포넌트 구현 (TOP 1 강조, 순위별 그라데이션)
- [x] 테이블뷰 컴포넌트 구현
- [x] 카드뷰/테이블뷰 전환 기능 (localStorage 저장)
- [x] 반응형 디자인 적용

## Phase 4: RSS 피드 및 자동 스케줄링 기능 구현
- [x] RSS 피드 생성 엔드포인트 구현
- [x] 자동 스크래핑 스케줄러 구현 (매일 업데이트)

## Phase 5: 통합 테스트 및 체크포인트 저장
- [x] Vitest 테스트 작성 (API 엔드포인트 검증)
- [x] 스크래핑 기능 통합 테스트
- [x] 프로젝트 체크포인트 저장

## Phase 6: 최종 결과물 전달
- [ ] 사용자에게 결과물 전달

## Bug Fixes
- [x] React key 중복 오류 수정 (데이터베이스 쿼리에서 고유한 ranking ID 사용)

## Data Alignment
- [x] KREAM 사이트 실제 인기 제품 스크래핑하여 정확한 데이터 수집
- [x] 시드 데이터 파일 업데이트 (브랜드명, 모델명, 가격 일치)
- [x] 스크래핑 로직 개선 (정확한 셀렉터 사용)

## Stealth Plugin Integration
- [x] playwright-extra 및 puppeteer-extra-plugin-stealth 패키지 설치
- [x] scraper.ts에 Stealth 플러그인 적용
- [x] User-Agent 및 브라우저 설정 개선
- [x] 랜덤 대기 시간 추가하여 봇 감지 우회

## Thumbnail Edit Feature
- [x] 제품 썸네일 URL 업데이트 API 추가 (tRPC procedure)
- [x] 관리자 전용 썸네일 수정 UI 구현 (카드에 편집 버튼 추가)
- [x] 썸네일 URL 입력 다이얼로그 구현
- [x] 권한 체크 (admin만 수정 가능)

## Real-time Price Scraping Schedule
- [x] 스케줄러 설정 변경 (Mock → Realtime 모드)
- [x] 스크래핑 주기 설정 (매 6시간마다: 3시, 9시, 15시, 21시)
- [x] 에러 핸들링 및 로깅 추가
- [x] 스크래핑 실패 시 재시도 로직 추가 (3회, 5분 간격)

## Price Change Alert Feature
- [x] 가격 변동 감지 로직 구현 (10% 이상 변동 시)
- [x] 관리자 알림 전송 기능 추가 (notifyOwner 사용)
- [x] 스크래핑 시 가격 비교 및 알림 트리거
- [x] 알림 메시지 포맷 설정 (제품명, 이전 가격, 현재 가격, 변동률)

## Price History Chart Feature
- [x] 제품별 가격 히스토리 조회 API 추가 (tRPC procedure)
- [x] 제품 상세 페이지 또는 모달 구현
- [x] Recharts를 사용한 라인 차트 컴포넌트 구현
- [x] 날짜별 가격 데이터 시각화
- [x] 가격 상승/하락 색상 구분 (상승: 빨강, 하락: 파랑)

## Search and Filter Feature
- [x] 헤더에 검색창 추가 (제품명 검색)
- [x] 브랜드 필터 드롭다운 추가
- [x] 검색어 및 필터 상태 관리 (useState)
- [x] 검색 및 필터 로직 구현 (클라이언트 사이드 필터링)
- [x] 검색 결과 없을 때 안내 메시지 표시

## Tooltip Feature
- [x] shadcn/ui Tooltip 컴포넌트 적용
- [x] 제품 카드에 툴팁 추가 (거래량, KREAM ID, 마지막 업데이트 시간)
- [x] 테이블뷰에도 툴팁 추가
- [x] 호버 시 부드러운 애니메이션 적용

## Sort Feature
- [x] 정렬 상태 관리 (useState)
- [x] 정렬 드롭다운 추가 (가격 낮은순, 높은순, 인기순)
- [x] 정렬 로직 구현 (useMemo)
- [x] 검색/필터와 정렬 조합 처리

## Real KREAM Image Scraping
- [ ] 스크래핑 로직에 제품 이미지 URL 추출 추가
- [ ] 인기 페이지 스크래핑 시 이미지 URL 수집
- [ ] 실시간 가격 조회 시 이미지 URL 수집
- [ ] 데이터베이스에 이미지 URL 저장 로직 업데이트
- [ ] Mock 데이터에도 실제 이미지 URL 반영

## Playwright Performance Optimization
- [x] 브라우저 풀(Browser Pool) 구현
- [x] 병렬 처리 (여러 탭 동시 실행)
- [x] 브라우저 인스턴스 재사용 로직
- [x] 성능 비교 테스트 작성

## User Custom Alert Feature
- [x] 데이터베이스 스키마 설계 (user_alerts 테이블)
- [x] 알림 등록 API 구현 (tRPC procedure)
- [x] 알림 조회/삭제 API 구현
- [x] 가격 변동 감지 및 사용자 알림 전송 로직
- [x] 프론트엔드 알림 관리 페이지 구현
- [x] 알림 등록 UI 구현 (제품 URL 입력)
- [x] 내 알림 목록 표시 및 관리 기능
- [x] Vitest 테스트 작성

## Target Price Alert Feature
- [x] 데이터베이스 스키마 확장 (alertType, targetPrice 필드 추가)
- [x] 알림 조건 처리 로직 수정 (변동률 + 목표 가격)
- [x] tRPC API 수정 (알림 생성 시 타입 선택)
- [x] 프론트엔드 UI 업데이트 (알림 타입 선택 라디오 버튼)
- [x] 목표 가격 입력 필드 추가
- [x] 알림 목록에 조건 표시 개선
- [x] Vitest 테스트 업데이트

## Admin Dashboard Feature
- [x] 관리자 권한 체크 미들웨어 (adminProcedure)
- [x] 사용자 목록 조회 API
- [x] 사용자 역할 변경 API
- [x] 알림 통계 API (전체 알림 수, 활성 알림 수 등)
- [x] 스크래핑 히스토리 조회 API
- [x] 관리자 대시보드 레이아웃 구현
- [x] 사용자 관리 페이지 UI
- [x] 알림 통계 대시보드 UI
- [x] 스크래핑 관리 UI
- [x] Vitest 테스트 작성

## Bulk Alert Management Feature
- [x] 일괄 비활성화 API 구현
- [x] 일괄 삭제 API 구현
- [x] 알림 목록에 체크박스 추가
- [x] 일괄 작업 버튼 UI 추가
- [x] 선택된 알림 개수 표시
- [x] Vitest 테스트 작성

## Vercel Deployment Guide
- [x] Vercel 배포 가이드 문서 작성 (DEPLOYMENT.md)

## Product Management Feature
- [x] 제품 정보 수정 API 구현 (이름, 이미지)
- [x] 관리자 제품 목록 페이지 구현
- [x] 제품 수정 다이얼로그 UI 구현
- [x] Vitest 테스트 작성

## Image Upload Feature
- [x] 이미지 업로드 API 구현 (S3 저장)
- [x] 파일 업로드 UI 구현 (드래그 앤 드롭 지원)
- [x] 이미지 미리보기 기능
- [x] 업로드 진행률 표시
- [x] Vitest 테스트 작성

## Drag and Drop Upload Feature
- [x] 드래그 앤 드롭 영역 UI 구현
- [x] 드래그 오버 시 시각적 피드백
- [x] 파일 드롭 이벤트 핸들러 구현
- [x] 여러 파일 드롭 시 첫 번째 파일만 처리

## Railway Deployment Issue
- [ ] Railway 배포 환경에서 스크래핑 실패 원인 진단 (Database not available 에러)
- [ ] Railway 환경에 맞게 스크래핑 로직 수정
- [ ] GitHub에 코드 푸시 및 Railway 자동 배포
- [ ] Railway 환경에서 스크래핑 기능 테스트
