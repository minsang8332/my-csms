# My CSMS

> 웹 및 데스크톱 기반 C/S 관리 프로그램

<video src="./preview.mp4" controls muted playsinline width="100%">
  브라우저에서 영상을 재생할 수 없습니다. 아래 링크로 영상을 열어주세요.
</video>

[미리보기](./preview.mp4)

## 시작하기

Docker 와 Node.js 가 설치되어 있어야 합니다.

```ps1
# windows os
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

.\start.ps1
```

## 빌드 및 데이터베이스 반영

```bash
docker compose exec csms-api npx prisma migrate deploy
```

### 로컬에서 DB 구조를 변경했을 때

새 마이그레이션 파일을 만들고, DB와 Prisma 타입을 갱신합니다.

```bash
cd csms-api
npm run migrate
```
