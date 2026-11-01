# Verification — October 31, 2026 — v6

- 40 automated tests passed, covering auth, CSRF/origin, private drafts, publish/unpublish, persistent settings, media checks/ranges, full Naver extraction/deduplication/refresh rules, private consultation requests, rate limits and retention.
- Build and source checks passed, including JavaScript syntax, static HTML assets/IDs, deployment output and all self-hosted Korean font files.
- Official Netlify Blobs SDK integration passed: data/sessions and a private consultation request survive a storage-server restart, media upload/read/ranges work, logout revokes access.
- Actual Naver native-server-fetch check: https://blog.naver.com/kmd_jjs/224457638569 imported 2,091 body characters, 22 editable sections and 4/4 images in about 3 seconds. Widget warning correctly retained.
- Actual running Netlify Dev CMS endpoint returned HTTP 200 and saved that post as a private draft with 4/4 images in about 2.6 seconds. Its public article endpoint remained HTTP 404 while draft.
- Root cause of prior failure: the mobile article host timed out before image processing. RSS and the desktop PostView endpoint were reachable; full importing now uses the desktop endpoint.
- Browser portrait alignment check measured a zero-pixel gap between image bottom and mint section bottom. Screenshot saved for review.
- Browser checks verified the Korean studio, SVG header, reusable media, article controls and hidden contact-field admin shortcut. Footer admin links are absent; password protection remains.
- Supplied SVG logo/favicon and current portrait retained. Original doctor image is unchanged. Video remains H.264 1280×720 with no audio stream.
- Production dependency audit previously reported zero known vulnerabilities; no production dependency change was required for the v4 fix.

No hosted Netlify site was deployed or modified. Hosted Naver connectivity and deployment configuration remain acceptance checks after deployment. Local runtime data, sessions, preview credentials, node_modules and generated output are excluded from the source ZIP. The locally imported draft is test-preview data and is not seeded in the ZIP.

## Version 5 browser and data checks

- Real pointer drag moved a button block above a divider; existing image size/alignment/AI settings and highlighted text were retained. Up/down movement and draft save/reopen also passed.
- Icon insertion sidebar and searchable thumbnail picker verified in the browser.
- Editor and preview both rendered a 1920×1080 source at approximately 533.33×300px with contain behavior; no stretching.
- Public article: same 300px image was 533.33×300px; a 38×38 source stayed 38×38; fill rendered 1280×250px with object-fit cover and centered cropping.
- Public header measured x=0, width=1280px, with its inner content width=1180px.
- Article/body and cover AI badges displayed where enabled; blog-card badge count was zero, including an AI-marked cover.
- Temporary published layout fixture was removed; existing user-created articles were preserved. One clearly labeled private visual-editor test draft remains in the local preview only, not in the ZIP.
- Native Naver full import still passed with 2,091 body characters, 22 sections and all four images; resulting formatted data passed the model validator.
- New automated cases verify rich formatting validation, unsafe-field removal/URL rejection, image size bounds, AI/layout persistence, additional block types, and safe Naver formatting extraction.

## Version 6 packaging checks

- Main typeface unified as Noto Sans KR Variable; no additional downloaded font families.
- Generated font binaries and license removed from the source upload, supplied during build from the locked production font package.
- GitHub source package kept below 100 files, with public source alone below 100 files.
- Clean source staging build/check performed without public/assets/fonts/ present. All 124 deployed font subsets and the license are generated and verified.
- Functional editor/API features unchanged; prior 40 tests and storage integration remain applicable.

## Version 7 verification

- 49 automated tests pass, including selected formatting toggles, mixed marks, complete inline reset, safe custom colors, Unicode excerpt truncation, paragraph spacing, thumbnail import, SSRF rejection and non-saving spacing repair.
- Build and source/deployment reference checks pass. Real Netlify Blobs SDK integration passes for sessions, private drafts, publish, persistence restart and media/ranges.
- Browser UI checks: select-all bold then unbold; custom green color; add favorite; recent/favorite entries; selected-color pressed state; highlight then Tx leaves plain text without strong/mark/color/link wrappers; save and reopen preserves text and color; Naver metadata action creates loaded thumbnail card; preview preserves a single newline and an intentional empty line.
- Native live import against kmd_jjs/224457638569: four of four body images plus two related thumbnails stored; TalkTalk URL cleaned. No existing user article was modified by QA. A private test draft named 편집기 서식 확인 · 테스트 remains in the local preview only.
- Not deployed to a production Netlify site; upload this source package to the connected GitHub repository and let Netlify build it.
