# SPEC-002 Docker와 Lambda 이중 실행 지원

- **문서 ID**: SPEC-002
- **기능명**: Docker와 Lambda 이중 실행 지원
- **진행 상태**: Development
- **대상 모듈**: `csms-api`, `csms-client`, `docker-compose.yml`, AWS 인프라 코드
- **작성자**: Codex
- **작성일**: 2026-09-12
- **최종 수정일**: 2026-09-12

---

## 1. 개요 및 목적

### 1.1 배경

현재 CSMS는 Docker Compose로 MariaDB, NestJS API, Nginx Web을 함께 실행한다. 사용 빈도가 낮은 인사 담당자용 서비스의 운영비를 줄이기 위해, AWS에서는 요청 기반 Lambda와 DynamoDB를 사용하는 별도 실행 경로를 제공한다.

기존 Docker 기반 개발 및 운영 경로는 삭제하거나 대체하지 않는다. 같은 API 소스가 환경 설정에 따라 MySQL/Prisma를 사용하는 컨테이너 모드와 DynamoDB를 사용하는 Lambda 모드로 각각 실행되어야 한다.

### 1.2 개발 목표

1. 기존 `docker compose up` 실행 방식과 MySQL 데이터를 보존한다.
2. NestJS API를 API Gateway를 통해 Lambda에서도 실행할 수 있게 한다.
3. 저장소 구현을 MySQL/Prisma와 DynamoDB로 분리하고 환경 변수로 선택한다.
4. Lambda 운영 경로에는 상시 실행 EC2, ECS, Fargate, RDS, NAT Gateway를 사용하지 않는다.
5. Lambda 환경은 신규 DynamoDB 데이터로 시작하며 기존 MySQL 데이터 이관은 수행하지 않는다.
6. Web은 Docker/Nginx와 S3/CloudFront 양쪽 배포 경로를 지원한다.

### 1.3 범위 제외 사항

- 기존 MySQL 데이터의 export, import, 변환 또는 삭제
- 기존 Docker Compose 서비스, Prisma schema, MySQL 볼륨의 제거
- Cognito 전환. 인증은 기존 bcrypt 및 JWT 인증 흐름을 유지한다.
- Electron의 로컬 시리얼 포트, 창 제어 기능을 Web/Lambda에서 지원하는 작업
- 다중 리전, 고가용성, 무중단 배포, 자동 확장 최적화

---

## 2. 요구사항 명세

### 2.1 기능 요구사항

- **FR-01 [공통 Nest 초기화]**: Nest application 생성, global prefix(`/v1/api`), validation, middleware 설정은 HTTP 서버와 Lambda handler가 공통으로 사용해야 한다.
- **FR-02 [컨테이너 실행 유지]**: `src/main.ts`는 `PORT` 환경 변수 또는 기본값 3000에서 HTTP 서버를 실행해야 한다. 현 Compose 환경은 MySQL/Prisma를 사용해야 한다.
- **FR-03 [Lambda handler]**: `src/lambda.ts`는 API Gateway HTTP API 이벤트를 처리하는 Lambda handler를 제공해야 한다. warm invocation에서는 bootstrap된 Nest application을 재사용해야 한다.
- **FR-04 [저장소 선택]**: `STORAGE_DRIVER=mysql|dynamodb` 환경 변수로 저장소 구현체를 선택해야 한다. 미설정 또는 `mysql`은 기존 Prisma 구현을 사용한다.
- **FR-05 [API 호환성]**: Items, CS, CS replies, Daily Vote, Auth, Health의 기존 URL, HTTP method, 요청 DTO 및 응답 형식은 두 실행 모드에서 호환되어야 한다.
- **FR-06 [DynamoDB 신규 시작]**: Lambda용 DynamoDB 테이블은 빈 상태에서 생성한다. 기존 MySQL 데이터를 자동으로 복사하거나 변경하지 않는다.
- **FR-07 [재고 원자성]**: CS 생성/수정/삭제로 품목 재고가 달라지는 요청은 DynamoDB transaction과 조건식을 사용해 원자적으로 처리해야 한다.
- **FR-08 [인증 유지]**: Docker와 Lambda 모두 bcrypt 비밀번호 검증 및 기존 JWT Access/Refresh Token 흐름을 사용해야 한다. Lambda의 사용자·세션 데이터는 DynamoDB에 저장한다.
- **FR-09 [첨부 파일]**: Lambda 모드에서 라이선스 등 파일은 S3 presigned URL로 업로드하고, DB에는 S3 object key와 원본 파일명을 저장해야 한다.
- **FR-10 [백업 분리]**: Docker 모드의 MySQL dump 백업 기능은 유지한다. Lambda 모드에서는 Docker 명령이나 로컬 영속 경로를 사용하지 않으며 DynamoDB PITR 및 선택적 S3 내보내기로 대체한다.
- **FR-11 [Web 이중 배포]**: Docker 모드는 현 Nginx 정적 파일 제공을 유지한다. AWS 모드는 S3/CloudFront가 Web과 `/v1/api/*` API를 같은 도메인으로 제공해야 한다.

### 2.2 비기능 요구사항

- **NFR-01 [비파괴성]**: `csms-db/data`, MySQL schema 및 기존 레코드를 초기화, 삭제, 강제 마이그레이션하지 않는다.
- **NFR-02 [비용]**: Lambda 모드의 상시 컴퓨팅 리소스는 없어야 한다. DynamoDB는 `PAY_PER_REQUEST`를 사용하고 Lambda는 VPC에 연결하지 않는다.
- **NFR-03 [보안]**: JWT secret, DB 접속 정보, AWS credential은 저장소에 기록하지 않는다. Lambda는 필요한 DynamoDB/S3 권한만 가진 IAM role을 사용한다.
- **NFR-04 [로그]**: Lambda 로그의 보존 기간은 기본 7일이며, password, refresh token, JWT secret은 로그에 남기지 않는다.
- **NFR-05 [운영]**: AWS Budget 알림을 월 $1, $3, $5 임계값으로 설정한다.

---

## 3. 상세 설계 명세

### 3.1 실행 구조

```text
Docker 모드
  docker compose up
    ├─ MariaDB
    ├─ Nest API (main.ts, STORAGE_DRIVER=mysql)
    └─ Nginx + Web

Lambda 모드
  CloudFront
    ├─ / → S3 Web 정적 파일
    └─ /v1/api/* → API Gateway HTTP API
                        └─ Nest Lambda (lambda.ts, STORAGE_DRIVER=dynamodb)
                              ├─ DynamoDB
                              └─ S3 첨부 파일
```

### 3.2 코드 구조

```text
csms-api/src/
  bootstrap.ts                    # 공통 Nest application 생성
  main.ts                         # 포트 기반 HTTP 서버
  lambda.ts                       # API Gateway Lambda handler
  storage/
    storage.module.ts             # STORAGE_DRIVER별 provider 선택
    contracts/                    # Repository interface와 domain type
    mysql/                        # 기존 Prisma 기반 repository
    dynamodb/                     # DynamoDB Document Client 기반 repository
```

각 도메인 서비스는 `PrismaService`가 아닌 repository interface에 의존한다. `StorageModule`은 실행 시점에 한 구현체만 주입한다.

### 3.3 DynamoDB 데이터 모델

초기 구현은 유지보수성과 쿼리 명확성을 우선해 다음 테이블을 사용한다.

| 테이블 | 기본 키 | 주요 용도 |
| --- | --- | --- |
| `csms-items` | `id` | 품목, 가격, 재고 |
| `csms-cases` | `id` | CS 본문, 상태, 접수/출고 정보 |
| `csms-case-replies` | `csId` + `id` | CS 답글 |
| `csms-shipped-items` | `csId` + `id` | CS별 출고 품목 |
| `csms-daily-votes` | `id` | 일일 투표 |
| `csms-users` | `id` | 사용자, 이메일 unique 조회 GSI |
| `csms-auth-sessions` | `id` | refresh token hash 및 만료 시간 |

각 테이블은 On-Demand, 서버 측 암호화, PITR을 활성화한다. 사용자 이메일 조회, CS 상태/생성일 조회, 일일 투표 중복 확인에 필요한 GSI는 실제 서비스 쿼리에 맞춰 정의한다.

### 3.4 인증 및 Secret

- JWT Access/Refresh Token API와 bcrypt password hash 방식은 유지한다.
- Lambda의 `JWT_SECRET`, `JWT_REFRESH_SECRET`은 Lambda 환경 변수 또는 Secrets Manager에서 제공한다.
- Refresh token 원문은 저장하지 않고 hash만 `csms-auth-sessions`에 저장한다.
- Docker의 `.env`, `.env.api`는 기존대로 유지하고 AWS secret과 공유하지 않는다.

### 3.5 파일 및 백업

- Web은 API에서 발급받은 presigned URL로 첨부 파일을 S3에 직접 업로드한다.
- Lambda API는 object key만 저장하며 S3 object는 private으로 유지한다.
- Docker 모드의 `BackupService`는 현 동작을 보존한다.
- Lambda 모드의 backup API는 Docker/MySQL dump를 실행하지 않는다. PITR 복구 절차를 운영 문서로 제공하고, 필요 시 S3 JSON/CSV export 기능을 별도 추가한다.

### 3.6 AWS 인프라

- S3 Web bucket: CloudFront Origin Access Control로만 읽기 허용
- S3 attachment bucket: Lambda signing role과 인증된 사용자 presigned URL만 사용
- CloudFront: `/v1/api/*`는 API Gateway origin, 나머지는 Web origin
- API Gateway: HTTP API 사용
- Lambda: Node.js runtime, 최소 권한 IAM role, CloudWatch Logs 7일 보존
- DynamoDB: 위 데이터 모델의 On-Demand 테이블
- 비용 알림: AWS Budget 및 이메일 알림

AWS Lambda가 DynamoDB/S3의 공개 AWS endpoint를 호출하는 데 VPC는 필요하지 않다. VPC와 NAT Gateway를 추가하지 않아 저사용량 서비스의 고정 비용을 피한다.

---

## 4. 구현 단계

1. `bootstrap.ts`, `main.ts`, `lambda.ts`를 분리하고 Docker 회귀 테스트를 통과시킨다. **(완료)**
2. DynamoDB runtime에서는 Prisma 연결을 생략하고 기존 Docker runtime에서만 MySQL에 연결한다. **(완료)**
3. DynamoDB adapter를 Items부터 구현하고 단위 테스트로 두 adapter의 동작을 비교한다. **(진행 중)**
4. CS, replies, shipped items, 재고 transaction, Daily Vote, User/Auth 순서로 DynamoDB adapter를 확장한다.
5. Lambda용 JWT 세션 저장, S3 presigned URL, Lambda용 backup 대체 동작을 구현한다.
6. CDK 또는 SAM으로 AWS 인프라를 정의하고 dev stage에 배포한다.
7. Web 정적 배포와 CloudFront API routing을 적용한다.
8. 신규 DynamoDB에서 인수 테스트를 수행하고 production stage 배포 여부를 검토한다.

## 5. 검증 계획

관련 검증 문서: 구현 착수 시 `specs/verifications/infrastructure/VERIFY-002-dual-runtime-lambda.md`를 작성한다.

- Docker Compose에서 MySQL API, Nginx Web, 기존 backup 기능이 정상 동작한다.
- Lambda에서 `/v1/api/health`와 기존 API route가 API Gateway를 통해 응답한다.
- MySQL adapter와 DynamoDB adapter에 동일한 CRUD contract test를 실행한다.
- DynamoDB transaction에서 재고 부족·동시 수정 요청이 잘못된 재고 수량을 만들지 않는다.
- Lambda 로그인, refresh, 로그아웃 후 session 처리와 JWT Guard를 검증한다.
- S3 presigned URL은 허용된 파일 업로드만 처리하고 직접 public access를 허용하지 않는다.
- CloudFront에서 Web route 새로고침과 `/v1/api/*` forwarding이 정상 동작한다.
- 기존 MySQL DB의 테이블·레코드·볼륨이 변경되지 않았음을 확인한다.
- AWS Budget 알림과 CloudWatch 7일 로그 보존 정책을 확인한다.

## 6. 수용 기준

1. `docker compose up`이 기존 MySQL 데이터로 정상 실행된다.
2. 같은 API 코드가 Lambda handler로 배포되어 DynamoDB 신규 데이터로 정상 실행된다.
3. 두 모드의 핵심 API contract가 호환된다.
4. Lambda 경로는 EC2, ECS, Fargate, RDS, NAT Gateway 없이 배포된다.
5. 구현 과정에서 기존 MySQL 데이터 이관, 초기화 또는 삭제가 수행되지 않는다.

## 7. 문서 변경 이력

| 일시 | 버전 | 작성자 | 변경 내용 |
| --- | --- | --- | --- |
| 2026-09-12 | v0.1.0 | Codex | Docker 유지 및 Lambda 이중 실행 지원 초안 작성 |
| 2026-09-12 | v0.2.0 | Codex | 공통 Nest bootstrap, Lambda handler 및 DynamoDB 런타임 기반 구현 시작 |
| 2026-09-12 | v0.3.0 | Codex | DynamoDB 모드의 Prisma 연결 차단 및 Items CRUD adapter 구현 |
