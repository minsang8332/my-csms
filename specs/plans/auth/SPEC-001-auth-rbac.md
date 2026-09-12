# SPEC-001 인증 및 역할 기반 접근 제어(RBAC)

- **문서 ID**: SPEC-001
- **진행 상태**: In Review
- **대상 모듈**: `csms-api`, `csms-client`, MySQL/Prisma adapter, DynamoDB adapter
- **작성일**: 2026-08-28
- **최종 수정일**: 2026-09-12

## 1. 목표와 범위

Docker의 로컬 환경은 MySQL/Prisma, AWS Lambda 환경은 DynamoDB를 사용하되 동일한 인증·인가 API 계약을 제공한다. 기존 MySQL 데이터는 초기화하거나 DynamoDB로 이관하지 않는다. DynamoDB는 신규 데이터로 시작한다.

포함 범위는 JWT 인증, refresh token 회전, 초대 기반 가입, RBAC, 감사 로그, MySQL과 DynamoDB의 이중 저장소 adapter이다. 일일 투표 모듈과 공개 회원가입은 범위에서 제외한다.

## 2. 실행 및 저장소 정책

| 환경 | `STORAGE_DRIVER` | 인증 데이터 |
| --- | --- | --- |
| Docker/로컬 | `mysql` | Prisma의 User/Auth/역할 관련 테이블 |
| AWS Lambda | `dynamodb` | DynamoDB users, sessions, roles, permissions, invitations, audit tables |

로컬에서 DynamoDB를 실행할 필요는 없다. 개발·회귀 검증은 MySQL adapter에서 수행하고, DynamoDB adapter는 AWS dev 환경에서 통합 검증한다. 두 adapter는 동일한 repository interface와 API contract test를 통과해야 한다.

## 3. 역할 및 권한 정책

| 역할 | CS 조회 | CS 생성·수정·삭제·답글 | 사용자 비활성화(회원 탈퇴) | 역할·권한 관리 |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | 가능 | 가능 | 가능 | 가능 |
| `ADMIN` | 가능 | 가능 | 가능 | 가능 |
| `OPERATOR` | 가능 | 가능 | 불가 | 불가 |
| `VIEWER` | 가능 | 불가 | 불가 | 불가 |

CS는 조직 내 공유 업무 데이터로 취급한다. 따라서 권한이 있는 ADMIN/OPERATOR는 작성자와 무관하게 수정·삭제할 수 있다. 모든 보호 endpoint는 서버 Guard에서 권한을 검사하며 클라이언트 메뉴 표시만으로 접근을 허용하지 않는다.

기본 권한은 `cs:read`, `cs:create`, `cs:update`, `cs:delete`, `cs:reply-manage`, `user:read`, `user:disable`, `user:role-assign`, `role:read`, `role:update`, `audit:read`로 관리한다. 재고 권한은 기존 Items 정책을 별도 확정하기 전까지 ADMIN과 OPERATOR에 읽기·수정 권한을 부여한다.

## 4. 계정과 세션 요구사항

- 공개 `POST /auth/signup`은 제거하고 관리자 초대 수락 방식으로 대체한다.
- 최초 `SUPER_ADMIN`은 DB seed로 idempotent하게 생성한다. seed 입력은 `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME` 환경 변수이며, 누락 시 seed는 실패한다.
- 초대 링크 GET은 상태만 확인한다. 사용자 생성과 비밀번호 설정은 명시적 POST에서 단일 transaction으로 처리한다.
- 비밀번호는 bcrypt hash로만 저장한다. 기본 비밀번호 또는 공통 비밀번호는 사용하지 않는다.
- access token은 15분, refresh token은 7일을 기본값으로 한다.
- refresh token 원문은 DB에 저장하지 않고 SHA-256 또는 bcrypt hash와 session family 정보만 저장한다.
- refresh 시 기존 session을 폐기하고 새 session을 만든다. 폐기된 token 재사용 시 같은 family의 모든 session을 폐기한다.
- 비밀번호 변경, 역할 변경, 사용자 비활성화, 전체 로그아웃 시 `authVersion`을 증가시켜 기존 access token을 즉시 무효화한다.
- JWT secret은 운영 환경에서 필수이며 fallback secret을 허용하지 않는다.

## 5. Web 및 Electron 토큰 저장

Web은 access/refresh token을 localStorage 또는 sessionStorage에 저장하지 않는다.

- 로그인·갱신 응답은 `HttpOnly`, `Secure`, `SameSite=Strict` cookie로 refresh token을 설정한다.
- access token은 메모리에만 보관하고 새로고침 시 refresh endpoint로 재발급한다.
- Web API는 HTTPS에서만 cookie를 사용한다. CSRF 방어를 위해 SameSite 정책과 Origin 검증을 적용한다.
- Electron은 renderer에 refresh token을 노출하지 않고 main process의 OS secure storage에 보관한다.

## 6. DynamoDB 모델

| 테이블 | 키 | 보조 조회 |
| --- | --- | --- |
| `csms-users` | `id` | `email` GSI, `authVersion`, `deletedAt` |
| `csms-auth-sessions` | `id` | `userId` GSI, `familyId`, `tokenHash`, `expiresAt` TTL |
| `csms-roles` | `id` | `code` GSI |
| `csms-permissions` | `id` | `code` GSI |
| `csms-user-roles` | `userId` + `roleId` | role별 사용자 조회 |
| `csms-role-permissions` | `roleId` + `permissionId` | 역할별 권한 조회 |
| `csms-user-invitations` | `id` | `activeEmail` GSI, `tokenHash`, `expiresAt` TTL |
| `csms-auth-audit-logs` | `id` | `actorUserId`/`createdAt` 조회 |

모든 DynamoDB 테이블은 On-Demand, 암호화, PITR을 사용한다. MySQL에는 같은 의미의 Prisma 모델과 unique/index 제약을 만든다. invitation 수락, 역할 변경, 마지막 SUPER_ADMIN 보호는 MySQL transaction과 DynamoDB `TransactWriteItems`로 원자 처리한다.

## 7. API 정책

- 공개: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/invitations/verify`, `POST /auth/invitations/accept`, `GET /health`
- 인증 필요: `POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me`, `PATCH /auth/password`, `DELETE /auth/withdraw`
- 권한 필요: Items, CS, users, roles, permissions, invitations, backup의 모든 endpoint
- 일일 투표 관련 endpoint는 제공하지 않는다.

## 8. 구현 순서 및 수용 기준

1. repository contract와 MySQL/DynamoDB adapter를 만든다.
2. User, Session, Role, Permission 모델과 SUPER_ADMIN seed를 구현한다.
3. JWT Guard, permission decorator/guard, authVersion 검증을 구현한다.
4. 초대, 비밀번호 변경, 로그아웃, 감사 로그를 구현한다.
5. Web cookie flow와 Electron secure storage flow를 구현한다.
6. API별 permission matrix와 MySQL/DynamoDB contract test를 작성한다.

수용 기준은 Docker에서 기존 MySQL과 함께 인증이 동작하고, Lambda에서 DynamoDB로 같은 API 계약이 동작하는 것이다. Web에는 토큰이 Web Storage에 남지 않아야 하며, VIEWER는 CS를 수정·삭제할 수 없고 ADMIN/OPERATOR는 가능해야 한다. 기존 MySQL 데이터의 초기화·삭제·이관은 수행하지 않는다.

## 9. 변경 이력

| 일시 | 버전 | 변경 내용 |
| --- | --- | --- |
| 2026-08-28 | v0.1.0 | MySQL 기반 인증/RBAC 초안 작성 |
| 2026-09-12 | v0.3.0 | DynamoDB 이중 저장소, DB seed SUPER_ADMIN, 역할 정책, HttpOnly cookie 정책 반영 및 일일 투표 제거 |
