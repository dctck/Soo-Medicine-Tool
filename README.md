# 수 한의원 CMS — Netlify MVP

## 이번 버전
- 섹션 추가 메뉴 중복/열린 메뉴 문제 수정
- 글/관련진료/미디어 메타데이터를 Netlify Blobs에 저장하는 persistence endpoint
- Naver RSS (`kmd_jjs`) 새 글 확인 + draft import
- 가져온 글은 자동 게시하지 않음
- 기존 section builder / preview 유지

## Netlify 배포
1. 이 폴더를 GitHub repo에 올립니다.
2. Netlify에서 Add new project → Import an existing project → GitHub repo 선택.
3. 별도 build command 없음. Publish directory는 `.`.
4. 배포 후 CMS를 열면 상단이 `Netlify에 자동 저장됨`으로 바뀝니다.
5. `네이버 글 가져오기` → `네이버 글 확인`으로 RSS를 테스트합니다.

## 중요한 MVP 범위
Naver RSS가 제공하는 제목/날짜/URL/description은 자동으로 가져옵니다.
RSS가 전체 본문/모든 이미지를 제공하지 않는 글은 원문 링크를 보존한 draft로 가져와 CMS에서 교체/편집합니다.
다음 단계에서 실제 Naver 글의 full-body/image extraction 성공률을 별도로 높일 수 있습니다.

## 미디어
현재 UI의 이미지 자체는 localStorage data URL 방식을 유지합니다. 프로덕션 업로드 endpoint를 붙일 때 Netlify Blobs의 별도 media store로 옮길 수 있습니다.
