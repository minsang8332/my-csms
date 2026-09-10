# SPEC-001 인증 및 역할 기반 접근 제어(RBAC)

- **문서 ID**: SPEC-001
- **기능명**: 인증 및 역할 기반 접근 제어
- **진행 상태**: In Review
- **대상 모듈**: `csms-api`, `csms-api/prisma`
- **작성자**: Codex
- **작성일**: 2026-08-28
- **최종 수정일**: 2026-08-28

---

## 1. 개요 및 목적

### 1.1 배경

현재 `csms-api`에는 회원가입, 로그인, Access/Refresh Token 발급, 토큰 갱신, 회원 탈퇴 및 JWT Guard의 기본 구현이 존재한다. 그러나 JWT Guard는 회원 탈퇴 API에만 적용되어 있고 재고, CS, 사용자, 투표 관리, 백업 API에는 인증·인가가 연결되어 있지 않다. 클라이언트가 임의로 전달한 `group` 값도 권한과 무관한 문자열로 저장되고 있으며, 역할과 권한을 관리하는 데이터 모델 및 API가 없다.

Refresh Token은 원문으로 저장되고 갱신 후 기존 토큰이 폐기되지 않는다. 입력값 검증, 로그인 시도 제한, 로그아웃, 현재 사용자 조회, 역할 변경 감사 기록도 제공되지 않는다.

### 1.2 개발 목표

1. 이메일과 비밀번호 기반 인증을 운영 가능한 수준으로 보강한다.
2. 모든 보호 대상 API에 일관된 JWT 인증을 적용한다.
3. 사용자에게 하나 이상의 역할을 부여하고 역할별 권한을 관리하는 RBAC를 구현한다.
4. Refresh Token 회전, 폐기 및 재사용 탐지를 포함한 세션 관리를 구현한다.
5. 기존 사용자 및 업무 데이터를 초기화하지 않는 비파괴적 DB 마이그레이션을 제공한다.
6. 관리자 초대와 이메일 확인을 기반으로 한 제한 회원가입을 구현한다.
7. 향후 동일 문서에 UI 요구사항을 추가할 수 있도록 DB/API와 UI 단계를 구분한다.

### 1.3 현재 구현 범위

- Prisma 데이터 모델 및 마이그레이션
- 인증, 세션, 사용자, 역할, 권한 관리 API
- 인증·권한 Guard와 Decorator
- 기존 API에 대한 인증·권한 정책 적용
- 입력 검증, 오류 응답, 감사 로그
- 단위 테스트 및 API 통합 테스트

### 1.4 범위 외 항목(Non-Goals)

- 로그인·사용자·역할 관리 UI 구현
- 소셜 로그인, OAuth, SSO
- MFA 및 생체 인증
- 이메일 기반 비밀번호 찾기·재설정
- 조직·테넌트별 데이터 격리
- DB 초기화, 기존 테이블 전체 삭제 또는 데이터 리셋

UI는 본 스펙의 후속 단계로 동일 문서에 추가하되, 이번 DB/API 구현의 승인 및 검수 범위에는 포함하지 않는다.

### 1.5 제한 회원가입 요청 타당성 검토

| 요청안                                  | 검토 결과     | 반영 방향                                                                                                      |
| --------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| 관리자가 제한된 양식으로 가입 대상 지정 | 채택          | 이메일, 이름, 소속, 초기 역할을 포함하는 초대 API로 구현                                                       |
| 기존 메일 스크립트를 참고한 메일 발송   | 채택          | Nodemailer 설정 방식만 참고하고 인증정보는 환경변수로 분리한 API 서비스로 구현                                 |
| 메일 버튼 클릭 즉시 계정 생성           | 조건부 미채택 | 상태를 변경하는 `GET`은 메일 보안 스캐너가 먼저 호출할 수 있으므로 확인 화면을 거친 `POST`에서 생성            |
| 모든 사용자의 초기 비밀번호 `0000`      | 미채택 권고   | 공개된 공통 비밀번호는 계정 탈취 위험과 비밀번호 정책 충돌이 있으므로 초대 수락 시 본인 비밀번호 설정으로 대체 |

권장 흐름은 `관리자 초대 생성 → 이메일 발송 → 수신자가 링크 확인 → 비밀번호 설정 및 수락 POST → 계정 생성`이다. 사용자 경험상 이메일 버튼으로 가입 절차를 시작하지만, 링크 조회만으로 DB를 변경하지 않는다.

초기 비밀번호 `0000`을 반드시 유지해야 한다면 일반 로그인 자격증명으로 사용할 수 없도록 계정을 `PASSWORD_SETUP_REQUIRED` 상태로 생성하고, 유효한 초대 토큰을 함께 제시한 비밀번호 변경 요청만 허용해야 한다. 이 예외안은 보안상 권장하지 않으며 승인 전 구현하지 않는다.

---

## 2. 설계 원칙 및 용어

### 2.1 인증과 인가의 구분

- **인증(Authentication)**: 사용자의 신원을 확인하고 유효한 세션과 토큰을 발급한다.
- **인가(Authorization)**: 인증된 사용자가 요청한 작업을 수행할 권한이 있는지 확인한다.
- 인증에 성공했더라도 요구 권한이 없으면 API 접근을 거부한다.

### 2.2 역할과 그룹의 구분

- 기존 `User.group`은 소속 또는 업무 그룹 정보로 간주하여 보존한다.
- `User.group`을 권한 판단에 사용하지 않는다.
- 권한은 `Role`, `Permission`, `UserRole`, `RolePermission` 관계로만 판단한다.

### 2.3 기본 보안 원칙

- 보호 대상 API는 별도 허용 규칙이 없으면 기본적으로 거부한다(Deny by Default).
- 비밀번호, Refresh Token 및 JWT Secret 원문을 로그에 기록하지 않는다.
- DB에 Refresh Token 원문을 신규 저장하지 않는다.
- 환경변수에 필수 Secret이 없으면 애플리케이션 시작을 실패 처리한다.
- 사용자 비활성화, 역할 변경, 비밀번호 변경 및 전체 로그아웃은 기존 Access Token을 즉시 무효화한다.

---

## 3. 기능 요구사항

### 3.1 인증 및 계정

- **FR-AUTH-01 [로그인]**: 활성 사용자는 정규화된 이메일과 비밀번호로 로그인할 수 있다.
- **FR-AUTH-02 [토큰 발급]**: 로그인 성공 시 Access Token과 Refresh Token을 발급한다.
- **FR-AUTH-03 [토큰 갱신]**: 유효한 Refresh Token으로 Access/Refresh Token 쌍을 갱신한다.
- **FR-AUTH-04 [토큰 회전]**: 갱신에 사용한 Refresh Token은 즉시 폐기하고 다시 사용할 수 없게 한다.
- **FR-AUTH-05 [재사용 탐지]**: 폐기된 Refresh Token이 다시 제출되면 동일 token family의 모든 세션을 폐기한다.
- **FR-AUTH-06 [로그아웃]**: 현재 세션의 Refresh Token을 폐기한다.
- **FR-AUTH-07 [전체 로그아웃]**: 사용자의 모든 세션을 폐기하고 기존 Access Token을 무효화한다.
- **FR-AUTH-08 [현재 사용자]**: 인증된 사용자는 자신의 기본 정보, 역할 및 권한을 조회할 수 있다.
- **FR-AUTH-09 [비밀번호 변경]**: 현재 비밀번호 확인 후 새 비밀번호로 변경하며 모든 기존 세션을 폐기한다.
- **FR-AUTH-10 [비활성 사용자 차단]**: 탈퇴·비활성·잠금 사용자는 로그인, 토큰 갱신 및 보호 API 호출이 거부되어야 한다.
- **FR-AUTH-11 [로그인 실패 제한]**: 반복 로그인 실패 시 계정을 일정 시간 잠그고 감사 로그를 남긴다.
- **FR-AUTH-12 [공개 회원가입 중단]**: 기존 공개 `POST /auth/signup`을 제거하고 초대 기반 회원가입으로 대체한다.

### 3.2 제한 회원가입 및 이메일 초대

- **FR-INVITE-01 [초대 생성]**: `user:create` 권한이 있는 관리자는 이메일, 이름, 소속, 초기 역할을 입력해 초대를 생성할 수 있다.
- **FR-INVITE-02 [중복 제한]**: 이미 가입된 이메일 또는 유효한 미사용 초대가 있는 이메일에는 새 초대를 생성하지 않는다.
- **FR-INVITE-03 [초대 토큰]**: 암호학적으로 안전한 일회용 토큰을 발급하고 DB에는 토큰 해시만 저장한다.
- **FR-INVITE-04 [만료]**: 초대 토큰의 기본 유효시간은 24시간이며 환경변수로 조정할 수 있다.
- **FR-INVITE-05 [메일 발송]**: 초대 생성 후 Nodemailer 기반 메일 서비스가 가입 링크를 발송한다. SMTP 인증정보는 환경변수에서만 읽는다.
- **FR-INVITE-06 [안전한 수락]**: 가입 링크를 조회하는 `GET`은 토큰 상태만 확인하고 계정을 생성하지 않는다. 사용자의 명시적인 `POST` 수락 요청에서 계정을 생성한다.
- **FR-INVITE-07 [최초 비밀번호]**: 권장안은 수락 요청에서 비밀번호 정책을 만족하는 최초 비밀번호를 사용자가 설정하는 것이다.
- **FR-INVITE-08 [원자적 생성]**: 사용자, 초기 역할, 초대 수락 상태를 단일 트랜잭션으로 생성·갱신한다.
- **FR-INVITE-09 [재사용 방지]**: 만료·취소·사용 완료된 초대 토큰은 재사용할 수 없다.
- **FR-INVITE-10 [재발송·취소]**: 관리자는 미사용 초대를 재발송하거나 취소할 수 있으며 모든 작업은 감사 로그에 남긴다.
- **FR-INVITE-11 [발송 실패]**: 메일 발송 실패 시 사용자를 생성하지 않고 초대 상태를 `DELIVERY_FAILED`로 기록하여 안전하게 재시도할 수 있어야 한다.

메일 전송 구현은 `csms-api/scripts/one-off/send-daily-vote-email.js`의 Nodemailer 연결 방식을 참고하되, 단발성 스크립트를 런타임 코드에서 import하지 않고 별도의 `AuthMailService`로 구현한다.

### 3.3 사용자 관리

- **FR-USER-01 [사용자 생성]**: 권한이 있는 관리자는 사용자를 생성할 수 있다.
- **FR-USER-02 [사용자 조회]**: 권한이 있는 사용자는 사용자 목록과 상세 정보를 조회할 수 있다.
- **FR-USER-03 [사용자 수정]**: 권한이 있는 관리자는 이름과 소속 그룹 등 비권한 정보를 수정할 수 있다.
- **FR-USER-04 [사용자 비활성화]**: 사용자를 물리 삭제하지 않고 비활성화하며 모든 세션을 폐기한다.
- **FR-USER-05 [사용자 재활성화]**: 권한이 있는 관리자는 비활성 사용자를 재활성화할 수 있다.
- **FR-USER-06 [본인 보호]**: 관리자는 자신의 마지막 관리 권한을 제거하거나 자신을 비활성화하여 시스템 관리자가 사라지는 작업을 수행할 수 없다.

### 3.4 역할 및 권한 관리

- **FR-RBAC-01 [다중 역할]**: 한 사용자는 하나 이상의 역할을 가질 수 있다.
- **FR-RBAC-02 [역할 CRUD]**: 권한이 있는 관리자는 사용자 정의 역할을 생성, 조회, 수정, 비활성화할 수 있다.
- **FR-RBAC-03 [시스템 역할 보호]**: 기본 시스템 역할의 코드 변경과 삭제를 금지한다.
- **FR-RBAC-04 [권한 목록]**: 시스템이 제공하는 권한 코드를 조회할 수 있다.
- **FR-RBAC-05 [역할별 권한]**: 권한이 있는 관리자는 역할에 권한을 부여하거나 회수할 수 있다.
- **FR-RBAC-06 [사용자별 역할]**: 권한이 있는 관리자는 사용자에게 역할을 부여하거나 회수할 수 있다.
- **FR-RBAC-07 [즉시 반영]**: 역할·권한 변경은 해당 사용자의 기존 Access Token을 즉시 무효화하고 재로그인을 요구한다.
- **FR-RBAC-08 [마지막 최고 관리자 보호]**: 활성 `SUPER_ADMIN` 사용자가 1명만 남은 경우 해당 역할 회수 및 사용자 비활성화를 거부한다.
- **FR-RBAC-09 [서버 강제 정책]**: 클라이언트 표시 여부와 관계없이 모든 권한 판단은 서버에서 수행한다.

### 3.5 감사 기록

- **FR-AUDIT-01**: 로그인 성공·실패, 로그아웃, 토큰 재사용 탐지, 비밀번호 변경을 기록한다.
- **FR-AUDIT-02**: 사용자 생성·수정·비활성화·재활성화 및 역할 부여·회수를 기록한다.
- **FR-AUDIT-03**: 역할 생성·수정·비활성화 및 권한 변경을 기록한다.
- **FR-AUDIT-04**: 감사 기록에는 행위자, 대상, 작업 코드, 결과, 시각, IP, User-Agent를 포함하되 비밀번호와 토큰 원문은 포함하지 않는다.
- **FR-AUDIT-05**: 초대 생성·발송·재발송·취소·수락 및 발송 실패를 기록한다.

---

## 4. 역할 및 권한 정책 초안

### 4.1 기본 역할

| 역할 코드     | 목적                        | 변경·삭제 정책                   |
| ------------- | --------------------------- | -------------------------------- |
| `SUPER_ADMIN` | 모든 권한과 역할 관리       | 시스템 역할, 삭제 불가           |
| `ADMIN`       | 사용자 및 일반 운영 관리    | 시스템 역할, 코드 변경·삭제 불가 |
| `OPERATOR`    | 재고·CS 등 업무 데이터 처리 | 시스템 역할, 코드 변경·삭제 불가 |
| `VIEWER`      | 업무 데이터 읽기 전용       | 시스템 역할, 코드 변경·삭제 불가 |

### 4.2 권한 코드

권한 코드는 `{resource}:{action}` 형식으로 관리한다.

| 리소스      | 권한 코드                                                                           |
| ----------- | ----------------------------------------------------------------------------------- |
| 인증·사용자 | `user:read`, `user:create`, `user:update`, `user:disable`, `user:role-assign`       |
| 역할        | `role:read`, `role:create`, `role:update`, `role:disable`, `role:permission-assign` |
| 재고        | `item:read`, `item:create`, `item:update`, `item:delete`                            |
| CS          | `cs:read`, `cs:create`, `cs:update`, `cs:delete`, `cs:reply-manage`                 |
| 투표 관리   | `vote:status-read`, `vote:seed`, `vote:assign`                                      |
| 백업        | `backup:read`, `backup:execute`                                                     |
| 감사        | `audit:read`                                                                        |

`SUPER_ADMIN`은 `*` 권한으로 모든 현재·미래 권한을 허용한다. 나머지 역할의 초기 권한 조합은 승인 시 확정한다.

### 4.3 기존 API 보호 정책 초안

| API 영역                                             | 공개 여부 | 요구 권한                           |
| ---------------------------------------------------- | --------- | ----------------------------------- |
| `GET /health`                                        | 공개      | 없음                                |
| `POST /auth/login`, `POST /auth/refresh`             | 공개      | 없음                                |
| `GET /daily-votes/check`, `POST /daily-votes/submit` | 공개      | UUID 검증                           |
| `GET /daily-votes/status`                            | 검토 필요 | `vote:status-read` 또는 공개        |
| `/items` 조회                                        | 보호      | `item:read`                         |
| `/items` 생성·수정·삭제                              | 보호      | 대응하는 `item:*` 권한              |
| `/cs` 조회                                           | 보호      | `cs:read`                           |
| `/cs` 생성·수정·삭제·답변                            | 보호      | 대응하는 `cs:*` 권한                |
| `/daily-votes/seed`, `/unused`, `/assign`            | 보호      | `vote:seed` 또는 `vote:assign`      |
| `/backup`                                            | 보호      | `backup:read` 또는 `backup:execute` |
| `/users`, `/roles`, `/permissions`                   | 보호      | 대응하는 관리 권한                  |

---

## 5. API 명세

### 5.1 인증 API

| Method   | Endpoint                                    | 인증          | 설명                                     |
| -------- | ------------------------------------------- | ------------- | ---------------------------------------- |
| `POST`   | `/v1/api/auth/login`                        | 공개          | 로그인 및 토큰 쌍 발급                   |
| `POST`   | `/v1/api/auth/refresh`                      | Refresh Token | 토큰 회전                                |
| `POST`   | `/v1/api/auth/logout`                       | Access Token  | 현재 세션 폐기                           |
| `POST`   | `/v1/api/auth/logout-all`                   | Access Token  | 모든 세션 폐기                           |
| `GET`    | `/v1/api/auth/me`                           | Access Token  | 현재 사용자·역할·권한 조회               |
| `PATCH`  | `/v1/api/auth/password`                     | Access Token  | 본인 비밀번호 변경                       |
| `DELETE` | `/v1/api/auth/withdraw`                     | Access Token  | 본인 계정 비활성화                       |
| `GET`    | `/v1/api/auth/invitations/verify?token=...` | 공개          | 초대 토큰 유효성 확인, DB 상태 변경 없음 |
| `POST`   | `/v1/api/auth/invitations/accept`           | 초대 토큰     | 최초 비밀번호 설정 및 계정 생성          |

로그인 응답 예시:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "사용자",
    "group": "소속",
    "roles": ["OPERATOR"]
  }
}
```

### 5.2 사용자 관리 API

| Method  | Endpoint                              | 권한               | 설명                                 |
| ------- | ------------------------------------- | ------------------ | ------------------------------------ |
| `GET`   | `/v1/api/users`                       | `user:read`        | 사용자 목록, 검색, 페이지네이션      |
| `GET`   | `/v1/api/users/:id`                   | `user:read`        | 사용자 상세 조회                     |
| `POST`  | `/v1/api/users`                       | `user:create`      | 사용자 생성                          |
| `PATCH` | `/v1/api/users/:id`                   | `user:update`      | 사용자 기본 정보 수정                |
| `POST`  | `/v1/api/users/:id/disable`           | `user:disable`     | 사용자 비활성화 및 세션 폐기         |
| `POST`  | `/v1/api/users/:id/enable`            | `user:disable`     | 사용자 재활성화                      |
| `PUT`   | `/v1/api/users/:id/roles`             | `user:role-assign` | 사용자 역할 전체 교체                |
| `GET`   | `/v1/api/user-invitations`            | `user:read`        | 초대 목록 및 발송 상태 조회          |
| `POST`  | `/v1/api/user-invitations`            | `user:create`      | 제한 회원가입 초대 생성 및 메일 발송 |
| `POST`  | `/v1/api/user-invitations/:id/resend` | `user:create`      | 미사용 초대 토큰 재발급 및 재발송    |
| `POST`  | `/v1/api/user-invitations/:id/revoke` | `user:disable`     | 미사용 초대 취소                     |

기존 `GET /auth/users`는 새 API 전환 기간에만 유지하고 제거 예정 응답 헤더 또는 로그를 남긴다. 공개 `POST /auth/signup`은 초대 수락 API 적용 후 제거한다.

### 5.3 역할·권한 API

| Method  | Endpoint                        | 권한                     | 설명                      |
| ------- | ------------------------------- | ------------------------ | ------------------------- |
| `GET`   | `/v1/api/roles`                 | `role:read`              | 역할 목록 조회            |
| `POST`  | `/v1/api/roles`                 | `role:create`            | 사용자 정의 역할 생성     |
| `PATCH` | `/v1/api/roles/:id`             | `role:update`            | 역할 이름·설명 수정       |
| `POST`  | `/v1/api/roles/:id/disable`     | `role:disable`           | 사용자 정의 역할 비활성화 |
| `GET`   | `/v1/api/permissions`           | `role:read`              | 권한 목록 조회            |
| `PUT`   | `/v1/api/roles/:id/permissions` | `role:permission-assign` | 역할 권한 전체 교체       |

### 5.4 감사 API

| Method | Endpoint                  | 권한         | 설명                        |
| ------ | ------------------------- | ------------ | --------------------------- |
| `GET`  | `/v1/api/auth-audit-logs` | `audit:read` | 감사 로그 검색·페이지네이션 |

감사 API는 기본적으로 최근 순으로 반환하며 기간, 행위자, 대상, 작업 코드 및 성공 여부 필터를 지원한다.

### 5.5 공통 오류 응답

```json
{
  "statusCode": 403,
  "code": "AUTH_PERMISSION_DENIED",
  "message": "Required permission is missing",
  "timestamp": "2026-08-28T00:00:00.000Z",
  "path": "/v1/api/roles"
}
```

| HTTP 상태 | 오류 코드 예시             | 조건                           |
| --------- | -------------------------- | ------------------------------ |
| `400`     | `AUTH_INVALID_INPUT`       | DTO 검증 실패                  |
| `401`     | `AUTH_INVALID_CREDENTIALS` | 이메일 또는 비밀번호 불일치    |
| `401`     | `AUTH_TOKEN_EXPIRED`       | Access/Refresh Token 만료      |
| `401`     | `AUTH_SESSION_REVOKED`     | 폐기된 세션 또는 토큰 재사용   |
| `403`     | `AUTH_PERMISSION_DENIED`   | 요구 권한 없음                 |
| `409`     | `AUTH_EMAIL_CONFLICT`      | 중복 이메일                    |
| `409`     | `AUTH_INVITATION_CONFLICT` | 유효한 중복 초대               |
| `409`     | `AUTH_LAST_SUPER_ADMIN`    | 마지막 최고 관리자 보호 위반   |
| `410`     | `AUTH_INVITATION_EXPIRED`  | 만료·취소·사용 완료된 초대     |
| `423`     | `AUTH_ACCOUNT_LOCKED`      | 로그인 실패 누적으로 계정 잠김 |

인증 실패 응답은 이메일 존재 여부를 노출하지 않는다.

---

## 6. 토큰 및 세션 설계

### 6.1 Access Token

- 기본 만료 시간: 15분, 환경변수로 조정 가능
- 필수 claim: `sub`(user ID), `sid`(session ID), `ver`(사용자 auth version), `iat`, `exp`
- JWT Strategy는 서명·만료뿐 아니라 사용자 활성 상태와 `authVersion` 일치 여부를 확인한다.
- 역할·권한 변경, 비밀번호 변경, 전체 로그아웃 및 계정 비활성화 시 `authVersion`을 증가시킨다.

### 6.2 Refresh Token

- 기본 만료 시간: 7일, 환경변수로 조정 가능
- 서버에는 단방향 해시만 저장한다.
- 토큰 갱신은 DB 트랜잭션 안에서 기존 세션 토큰 폐기와 신규 토큰 저장을 원자적으로 수행한다.
- 각 토큰은 `familyId`를 가지며 폐기된 토큰 재사용 시 같은 family의 모든 세션을 폐기한다.
- 로그아웃과 만료 후에도 감사에 필요한 세션 메타데이터는 보존한다.

### 6.3 Secret 설정

다음 환경변수는 필수이며 fallback 값을 허용하지 않는다.

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `AUTH_TOKEN_HASH_PEPPER`

운영 로그에 환경변수 원문을 출력하지 않는다.

---

## 7. 데이터 모델 변경

### 7.1 User 확장

기존 `users` 테이블과 데이터는 유지하고 다음 필드를 추가한다.

| 필드                 | 타입                      | 설명                                         |
| -------------------- | ------------------------- | -------------------------------------------- |
| `authVersion`        | `Int @default(0)`         | 기존 Access Token 일괄 무효화 버전           |
| `failedLoginCount`   | `Int @default(0)`         | 연속 로그인 실패 횟수                        |
| `blockedAt`          | `DateTime?`               | 계정 잠금 만료 시각                          |
| `lastLoginAt`        | `DateTime?`               | 최근 로그인 성공 시각                        |
| `passwordChangedAt`  | `DateTime?`               | 최근 비밀번호 변경 시각                      |
| `mustChangePassword` | `Boolean @default(false)` | 관리자가 발급한 초기 비밀번호 변경 필요 여부 |

기존 `deletedAt`은 비활성 상태 판단에 계속 사용한다. 기존 `group`은 삭제하거나 역할로 변환하지 않는다.

### 7.2 UserInvitation / UserInvitationRole

| 필드                     | 타입           | 설명                                                           |
| ------------------------ | -------------- | -------------------------------------------------------------- |
| `id`                     | UUID           | 초대 ID                                                        |
| `email`                  | String         | 정규화된 가입 대상 이메일                                      |
| `activeEmail`            | String? unique | 활성 초대 중복 방지용 이메일, 종료 상태에서는 null             |
| `name`                   | String         | 가입 시 사용할 이름                                            |
| `group`                  | String         | 가입 시 사용할 소속                                            |
| `tokenHash`              | String         | 일회용 초대 토큰 해시                                          |
| `status`                 | Enum           | `PENDING`, `DELIVERY_FAILED`, `ACCEPTED`, `REVOKED`, `EXPIRED` |
| `expiresAt`              | DateTime       | 초대 만료 시각                                                 |
| `sentAt`                 | DateTime?      | 최근 발송 성공 시각                                            |
| `acceptedAt`             | DateTime?      | 수락 시각                                                      |
| `createdByUserId`        | UUID           | 초대를 생성한 관리자                                           |
| `createdAt`, `updatedAt` | DateTime       | 생성·수정 시각                                                 |

- `UserInvitationRole`은 `invitationId + roleId` 복합 unique로 초기 역할을 보관한다.
- 토큰 원문과 SMTP 인증정보는 저장하지 않는다.
- 활성 초대는 `activeEmail=email`, 수락·취소·만료된 초대는 `activeEmail=null`로 저장하여 같은 이메일의 활성 초대를 DB unique 제약조건으로 하나만 허용한다.

### 7.3 Role

| 필드                     | 타입          | 설명                      |
| ------------------------ | ------------- | ------------------------- |
| `id`                     | UUID          | 기본 키                   |
| `code`                   | String unique | 변경되지 않는 역할 식별자 |
| `name`                   | String        | 표시 이름                 |
| `description`            | String?       | 역할 설명                 |
| `isSystem`               | Boolean       | 시스템 역할 여부          |
| `isActive`               | Boolean       | 사용 가능 여부            |
| `createdAt`, `updatedAt` | DateTime      | 생성·수정 시각            |

### 7.4 Permission

| 필드                     | 타입          | 설명                            |
| ------------------------ | ------------- | ------------------------------- |
| `id`                     | UUID          | 기본 키                         |
| `code`                   | String unique | `{resource}:{action}` 권한 코드 |
| `name`                   | String        | 표시 이름                       |
| `description`            | String?       | 권한 설명                       |
| `createdAt`, `updatedAt` | DateTime      | 생성·수정 시각                  |

### 7.5 UserRole / RolePermission

- `UserRole`: `userId + roleId` 복합 unique, 부여자 및 부여 시각 기록
- `RolePermission`: `roleId + permissionId` 복합 unique, 부여자 및 부여 시각 기록
- 역할과 권한 변경은 트랜잭션으로 처리한다.

### 7.6 AuthSession

현재 Prisma `Auth` 모델과 `auths` 테이블은 삭제하지 않고 세션 저장소로 확장한다.

| 필드                     | 타입      | 설명                           |
| ------------------------ | --------- | ------------------------------ |
| `id`                     | UUID      | 세션 ID 및 JWT `sid`           |
| `userId`                 | UUID      | 사용자 ID                      |
| `tokenHash`              | String?   | Refresh Token 단방향 해시      |
| `familyId`               | UUID?     | 토큰 회전 family ID            |
| `parentSessionId`        | UUID?     | 직전 Refresh Token 레코드 ID   |
| `replacedBySessionId`    | UUID?     | 회전으로 생성된 다음 레코드 ID |
| `expiresAt`              | DateTime  | 만료 시각                      |
| `lastUsedAt`             | DateTime? | 최근 갱신 시각                 |
| `revokedAt`              | DateTime? | 폐기 시각                      |
| `revokeReason`           | String?   | 폐기 사유 코드                 |
| `ipAddress`              | String?   | 세션 생성 IP                   |
| `userAgent`              | String?   | 세션 생성 User-Agent           |
| `createdAt`, `updatedAt` | DateTime  | 생성·수정 시각                 |

기존 `refreshToken` 컬럼은 전환 기간에만 nullable legacy 필드로 유지하고 검증 완료 후 별도 마이그레이션으로 제거한다.

`AuthSession` 레코드는 로그인 기기 하나당 1개만 갱신하는 방식이 아니라 Refresh Token이 회전할 때마다 새로 생성한다. 사용 완료된 이전 레코드는 `revokedAt`, `revokeReason`, `replacedBySessionId`와 해시를 유지하므로 과거 토큰 재사용 여부를 탐지할 수 있다. 같은 로그인 흐름에서 생성된 레코드는 동일한 `familyId`로 묶는다.

### 7.7 AuthAuditLog

| 필드                     | 타입     | 설명                            |
| ------------------------ | -------- | ------------------------------- |
| `id`                     | UUID     | 기본 키                         |
| `actorUserId`            | UUID?    | 행위자, 로그인 실패는 null 가능 |
| `targetType`, `targetId` | String?  | 변경 대상                       |
| `action`                 | String   | 감사 작업 코드                  |
| `success`                | Boolean  | 성공 여부                       |
| `reason`                 | String?  | 실패·거부 사유 코드             |
| `ipAddress`, `userAgent` | String?  | 요청 메타데이터                 |
| `metadata`               | JSON?    | 민감정보를 제외한 부가 정보     |
| `createdAt`              | DateTime | 발생 시각                       |

감사 기록은 API를 통해 수정·삭제할 수 없다.

---

## 8. 구현 구조

```text
csms-api/src/modules/auth/
├── controllers/
│   ├── auth.controller.ts
│   ├── users.controller.ts
│   ├── user-invitations.controller.ts
│   ├── roles.controller.ts
│   ├── permissions.controller.ts
│   └── auth-audit.controller.ts
├── decorators/
│   ├── public.decorator.ts
│   └── permissions.decorator.ts
├── dto/
├── guards/
│   ├── jwt-auth.guard.ts
│   └── permissions.guard.ts
├── services/
│   ├── auth.service.ts
│   ├── session.service.ts
│   ├── users.service.ts
│   ├── user-invitations.service.ts
│   ├── auth-mail.service.ts
│   ├── roles.service.ts
│   └── auth-audit.service.ts
└── strategies/
    └── jwt.strategy.ts
```

- 전역 JWT Guard를 등록하고 `@Public()`이 선언된 API만 인증 없이 허용한다.
- `@RequirePermissions('item:read')`와 `PermissionsGuard`로 권한을 검사한다.
- `SUPER_ADMIN`의 `*` 권한은 모든 세부 권한을 만족한다.
- 역할·권한 변경과 마지막 최고 관리자 검사는 DB 트랜잭션 안에서 수행한다.

---

## 9. 비파괴적 마이그레이션 계획

### Phase 1: 추가형 스키마 배포

1. `users`에 nullable 또는 기본값이 있는 인증 필드를 추가한다.
2. `roles`, `permissions`, `user_roles`, `role_permissions`, `user_invitations`, `user_invitation_roles`, `auth_audit_logs` 테이블을 새로 생성한다.
3. 기존 `auths` 테이블에 세션 필드를 nullable로 추가한다.
4. 기존 테이블과 사용자 데이터는 삭제·초기화하지 않는다.

### Phase 2: 기본 권한 데이터 및 관리자 지정

1. 시스템 역할과 권한을 idempotent upsert 방식으로 생성한다.
2. 검토 과정에서 확정된 기존 사용자 1명 이상에게 `SUPER_ADMIN` 역할을 부여한다.
3. `User.group` 값은 그대로 보존한다.

### Phase 3: 인증 코드 전환

1. 신규 로그인부터 Refresh Token 해시와 token family를 사용한다.
2. 기존 원문 Refresh Token 세션은 `revokedAt`과 전환 사유를 기록하여 비활성화하고 재로그인을 요구한다.
3. 레코드를 물리 삭제하지 않는다.

### Phase 4: 제약조건 강화

1. 신규 세션 전환과 검증이 완료된 후 `tokenHash`, `familyId` 제약조건을 강화한다.
2. legacy `refreshToken` 컬럼 제거는 별도 검증과 백업 확인 후 수행한다.
3. `prisma migrate reset`, `db push --force-reset`, `DROP`, `TRUNCATE`, DB 볼륨 삭제를 사용하지 않는다.

롤백은 새 테이블과 컬럼의 데이터를 유지한 채 이전 애플리케이션 버전으로 되돌릴 수 있도록 단계별 호환성을 확보한다.

---

## 10. 입력 검증 및 보안 요구사항

- `ValidationPipe`를 전역 적용하고 `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`를 사용한다.
- 이메일은 trim 후 소문자로 정규화하고 형식을 검증한다.
- 비밀번호는 12자 이상, bcrypt 입력 한계를 고려한 최대 길이를 적용한다.
- 비밀번호 해시는 bcrypt cost 12 이상을 기본값으로 하되 성능 검증 후 확정한다.
- 공통 초기 비밀번호 `0000`은 일반 로그인 자격증명으로 허용하지 않는다.
- 초대 확인 `GET` 요청은 사용자·역할·초대 상태를 변경하지 않는다.
- 초대 토큰은 URL·로그·오류 응답에서 마스킹하고 DB에는 pepper를 적용한 해시만 저장한다.
- SMTP 연결정보는 환경변수로 주입하고 메일 본문에 초기 비밀번호를 포함하지 않는다.
- 로그인 실패 메시지는 계정 존재 여부와 실패 원인을 구분해 노출하지 않는다.
- 기본 잠금 정책은 15분 동안 5회 연속 실패 시 15분 잠금으로 제안한다.
- API와 프록시 레벨에서 로그인·갱신 요청 rate limit을 적용한다.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, token hash pepper는 서로 다른 값이어야 한다.
- CORS가 필요한 배포 환경에서는 허용 origin을 명시하며 wildcard와 credential 조합을 금지한다.
- 역할 코드, 권한 코드 및 시스템 역할 변경 요청은 서버에서 검증한다.

---

## 11. 비기능 요구사항

- **NFR-01 [데이터 보존]**: 기존 사용자, 세션 및 업무 데이터가 마이그레이션 과정에서 초기화되거나 물리 삭제되지 않아야 한다.
- **NFR-02 [일관성]**: 토큰 회전, 역할 부여·회수, 사용자 비활성화는 각각 단일 트랜잭션으로 처리한다.
- **NFR-03 [성능]**: 인증·권한 확인으로 추가되는 API 지연의 p95는 로컬 DB 기준 50ms 이하를 목표로 한다.
- **NFR-04 [보안 로그]**: 비밀번호·토큰·Secret 원문이 애플리케이션 로그와 감사 로그에 존재하지 않아야 한다.
- **NFR-05 [추적성]**: 권한 변경 작업은 행위자와 변경 전후 정보를 감사 로그로 추적할 수 있어야 한다.
- **NFR-06 [호환성]**: 기존 API 소비자에게 인증 적용 일정을 사전 고지하고 전환 시점을 명확히 해야 한다.

---

## 12. 검증 계획 및 합격 기준

- 관련 검수 문서: 구현 시작 시 `VERIFY-001-auth-rbac.md`를 작성한다.

### 12.1 기능 검증

1. 활성 사용자의 정상 로그인과 잘못된 자격증명 거부
2. Access Token 만료, 위조, 잘못된 Secret 토큰 거부
3. Refresh Token 회전 및 이전 토큰 재사용 차단
4. 로그아웃·전체 로그아웃 후 세션 차단
5. 비활성·잠금·탈퇴 사용자의 로그인 및 API 접근 차단
6. 역할별 허용 API 성공과 미허용 API 403 응답
7. 역할 변경 후 기존 Access Token 즉시 차단
8. 마지막 `SUPER_ADMIN` 보호
9. 사용자·역할·권한 관리 작업 감사 로그 생성
10. 공개 API만 토큰 없이 호출 가능함을 확인
11. 초대 생성·메일 발송·토큰 확인·수락·재발송·취소 흐름 확인
12. 메일 링크 `GET` 요청만으로 사용자 레코드가 생성되지 않음을 확인
13. 만료·취소·사용 완료 토큰 및 동일 이메일 중복 초대 차단

### 12.2 마이그레이션 검증

1. 마이그레이션 전후 기존 `users`, `items`, `cs` 및 관련 테이블의 레코드 수와 핵심 데이터가 유지되어야 한다.
2. 기존 `User.group` 값이 변경되지 않아야 한다.
3. 기존 세션은 삭제되지 않고 폐기 상태와 사유가 기록되어야 한다.
4. 롤백 절차가 데이터 초기화 없이 수행되어야 한다.

### 12.3 자동화 테스트 최소 기준

- AuthService 및 SessionService 단위 테스트
- RolesService의 마지막 최고 관리자 보호 및 트랜잭션 테스트
- 로그인, 갱신, 로그아웃, 사용자·역할 관리 API 통합 테스트
- 초대 발송 성공·실패와 수락 트랜잭션 통합 테스트(Nodemailer transport mock 사용)
- 기존 Items, CS, DailyVote, Backup API 권한 매트릭스 통합 테스트
- DTO 검증 및 인증 오류 응답 스냅샷 또는 구조 테스트

모든 필수 테스트와 수동 보안 시나리오가 통과해야 `Implemented`로 변경할 수 있다.

---

## 13. UI 후속 단계(이번 범위 제외)

UI 작업을 시작할 때 이 절에 다음 요구사항을 추가한다.

- 로그인·로그아웃 화면 및 세션 만료 처리
- 관리자용 제한 회원가입 초대 양식과 초대 목록
- 이메일 링크의 초대 확인·비밀번호 설정·수락 화면
- 현재 사용자와 역할 표시
- 사용자·역할·권한 관리 화면
- 권한에 따른 메뉴 및 작업 버튼 표시
- 401/403 공통 처리와 재인증 흐름
- Electron과 Web 환경의 안전한 토큰 저장 전략

UI에서 기능을 숨기는 것은 편의 기능일 뿐이며 API 권한 검사를 대체하지 않는다.

---

## 14. 검토 필요 사항

승인 전에 다음 항목을 확정해야 한다.

1. 최초 `ADMIN`으로 지정할 기존 사용자와 지정 방식
2. `USER`, `ADMIN` 의 초기 권한 조합
3. 초대 수락 시 사용자가 안전한 최초 비밀번호를 설정하는 권장안을 승인할지
4. 요청한 공통 초기 비밀번호 `0000`을 보안 예외로 유지할지(미채택 권고)
5. 메일 링크 확인 후 명시적 수락 `POST`를 사용하는 방식을 승인할지
6. `GET /daily-votes/status`를 공개로 유지할지 인증 대상으로 변경할지
7. 로그인 잠금 기준(제안: 15분 내 5회 실패 시 15분 잠금)
8. Access/Refresh Token 만료 시간(제안: 15분/7일)
9. 초대 토큰 만료 시간(제안: 24시간)과 재발송 정책
10. 감사 로그 보존 기간과 개인정보 마스킹 기준
11. 기존 API에 인증을 일괄 적용할지 전환 기간을 둘지

---

## 15. 문서 변경 이력

| 일시       | 버전   | 작성자 | 변경 내용                                                 |
| ---------- | ------ | ------ | --------------------------------------------------------- |
| 2026-08-28 | v0.1.0 | Codex  | DB·API 인증 및 RBAC 초기 검토안 작성                      |
| 2026-08-28 | v0.2.0 | Codex  | 제한 회원가입·메일 초대 요구사항 및 보안 타당성 검토 반영 |
