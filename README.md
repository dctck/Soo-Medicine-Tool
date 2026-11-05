# Soo Clinic — complete Netlify replacement

Korean public website and password-only content studio. This package includes the actual HTML, CSS, JavaScript, server functions, tests, lockfile and supplied media. No external CMS account is needed.

## Replace your existing GitHub website

1. Back up the current repository. Extract this ZIP. Copy **all contents of `soo-clinic/`**, including `.github/`, `.gitignore`, and `.env.example`, into your repository root. Preserve the existing `.git/` directory. Remove obsolete website files from the old project after backing them up, so old routes do not remain public. This package does not migrate an old CMS automatically.
2. Commit and push to the branch already connected to Netlify. Keep the existing Netlify site/project to preserve its domain and future Blobs data.
3. In that Netlify site's build settings, use repository root as the base directory, `npm run build` as the build command and `dist` as the publish directory. `netlify.toml` already declares these and the functions directory. Remove any conflicting old framework/base-directory settings.
4. On your computer with Node 22 installed, run `npm ci`, then `npm run password`. Type a new password of at least 12 characters. The generator hides your typing and prints a salted password hash.
5. In Netlify's environment variables, add `ADMIN_PASSWORD_HASH` with that exact generated value. Use the **Functions** scope and production context. Do not put the password or hash in GitHub or frontend files. An optional `NAVER_BLOG_ID` provides an RSS import default; you can set the ID inside the CMS instead.
6. Redeploy after adding the environment variable. Open `https://YOUR-DOMAIN/admin/`, sign in with the password you chose, and fill in **홈페이지 설정**: doctor name/title, clinic telephone, address, hours and booking link. The doctor name follows your supplied reference; contact details in that reference were marked provisional, so confirm and enter them here. No medical credentials have been invented.
7. Add treatment information and articles, review the preview, then select **게시 · 공개** and save. New entries and RSS imports start as private drafts.

There is no shipped admin password. Until the hash is configured, the public website works and login fails closed. Changing the hash and redeploying invalidates all existing sessions. Use HTTPS for the deployed site. A blank settings field hides that contact detail.

## Routes and editing

- `/` — landing page, supplied portrait, silent introduction video, clinic interior, published treatments and three latest articles.
- `/blog/` — published articles, text search and treatment filter.
- `/blog/<slug>` — public article, structured sections and related published treatments. Draft URLs return no article data.
- `/admin/` — password login and content studio. Its static login shell is public; every private read and write is checked on the server.
- `/api/*` — Netlify Function endpoints. Calling the underlying function URL does not bypass authentication.

The editor has a Korean icon sidebar for text, heading, image, quote, callout, checklist, link, divider, spacer and button sections. Insertion points select where new sections are added. Move sections up/down, remove sections, select a cover, link related treatments, preview, publish, unpublish or delete. Slugs are lowercase ASCII and stay fixed after initial save to avoid broken links. Korean titles can use the generated slug or a custom English slug. There is no raw HTML editor. Inline text formatting is stored as validated text runs (bold, italic, underline, highlight, palette color and safe https links); scripts, arbitrary attributes and arbitrary CSS are not accepted.

The media library accepts PNG, JPEG, WebP, GIF, MP4 and WebM, up to **4,000,000 bytes per file**, with MIME/signature checks. SVG/HTML uploads are rejected. Uploaded media is **public website media**, not a patient record library. A referenced uploaded file cannot be deleted until references are removed. Included assets are managed in GitHub. For a larger replacement video, place it in `public/assets/intro.mp4` and commit it. Media URLs can also be copied into local asset fields by editing source defaults if needed. Uploaded video delivery supports byte-range requests.

Homepage settings choose from included files and uploaded media. The introduction video is muted, inline and looping; the supplied website copy has its audio track removed. A pause/play control is provided. Reduced-motion preferences pause autoplay. Browsers may also block autoplay.

## Naver full-article import (v2)

Open **네이버 글 가져오기**. The default blog ID is `kmd_jjs`; change it or save a different ID in 홈페이지 설정.

1. Choose **네이버 글 목록 확인**. RSS discovers up to 20 recent posts; its short description is only a preview.
2. Choose **전체 본문 가져오기** beside a post, or enter an individual public Naver post URL below the list.
3. The server reads the public desktop PostView article's SmartEditor body, preserving text paragraphs, quotations, supported headings, image order and related-link cards as editable sections. It downloads supported Naver-hosted images to the shared Blobs media library. Images can then be reused across articles.
4. The result is saved as a **private draft** and opened in the editor. Review it, choose related treatments, edit sections, then deliberately publish. The import note reports body character count, images imported/found and any warnings.

Reimporting an already-saved post opens the existing article without overwriting edits. To upgrade an older RSS-summary draft, open it and choose **네이버 전체 본문으로 교체** under its source URL. Save pending edits first and confirm the replacement. The title and related treatments are retained; body sections are replaced. Published articles must be changed to a draft before this action is allowed.

Only public `https://blog.naver.com` / `https://m.blog.naver.com` individual post URLs are fetched. Tracking parameters are removed for deduplication. Image downloads are restricted to four explicit Naver image-CDN hosts. Redirects are rejected. No arbitrary URL fetcher, login bypass or embedded script execution is provided.

Private/deleted/login-only posts and unsupported legacy editor formats can fail. On failure the importer shows an error and **does not silently save a truncated RSS summary as the full article**. Copy text into a new article manually if needed. Naver's fonts, interactive maps, TalkTalk, videos and widgets are not fully reproduced; text/link equivalents and warnings are supplied where possible. Original links remain available. An unsuccessful image is marked at its position, and the image count clearly indicates missing images.

Limits per post: 3 MB source HTML, 180,000 body characters, 50 editable sections, 20 images, 4 MB per image and bounded timeouts. Content that exceeds text/section limits fails explicitly rather than silently truncating. Downloaded images remain in the shared library even if a later content-save operation fails. A normal import can take around 45 seconds. Hosted connectivity still needs checking after deployment, since Naver can change page structures or restrict server traffic.

The old `/api/admin/import` RSS-summary endpoint remains for compatibility but is not the primary admin import UI. Full-body import uses `/api/admin/import/feed` and `/api/admin/import/full`.

## Persistence and access

Production content/settings/sessions use the site-wide `soo-cms-v1` Blobs store; uploaded bytes use `soo-media-v1`. Strong consistency makes publish/unpublish changes visible immediately. Stores persist across redeploys of the **same Netlify site**, independent of `dist`. Local development uses local emulator data. Deploy previews/branch deployments use separate branch-hashed store names, so they do not overwrite production data. Configure a separate preview password hash if preview editing is required. Existing production data is not copied to preview stores.

Passwords use salted scrypt; raw passwords are not persisted. Session IDs are random, stored as hashes server-side, expire after eight hours and are revoked on logout. Cookies are Secure, HttpOnly, host-only and SameSite=Strict. Mutations require a session, an exact same-origin header and a session CSRF token. Ten login attempts per IP/15-minute bucket are permitted; a Netlify function rate limit adds 120 requests per IP/domain per minute. Atomic create-only login slots cap simultaneous attempts; the platform limiter provides an additional bound. Expired sessions and old login attempts are removed daily by a scheduled function. Content/media writes use server-side validation and a restrictive content security policy. No CORS wildcard, client secret or arbitrary-URL importer is shipped.

This is a single shared admin login, not a multi-user/audited patient system. Simultaneous editors use last-save-wins behavior. Keep regular content backups using Netlify Blobs tooling and retain the source repository/media. Deleting the Netlify site deletes access to its data; the source ZIP alone does not back up CMS entries added later. Scheduled cleanup runs on published deploys; local test data can be reset by removing the project `.netlify/` directory after stopping the server.

## Develop and verify

```sh
npm ci
npm test
npm run test:integration
npm run build
npm run check
npm run dev -- --offline --no-open
```

Visit `http://localhost:8888`. For local CMS use, add a gitignored `.env` with a generated `ADMIN_PASSWORD_HASH`. Modern browsers accept Secure cookies on localhost; use the deployed HTTPS site if your local browser does not. Static HTML can be inspected without a backend, but CMS and dynamic content require Netlify Functions.

Tests cover authentication, password misconfiguration, rate limiting, session expiry/logout/password rotation, CSRF/origin checks, draft isolation, publishing/unpublishing, deletion, treatment order, settings validation, RSS sanitization/deduplication, media validation/size/ranges/reference protection and direct function access. Unit tests inject an in-memory store. `npm run test:integration` additionally starts Netlify's official local Blobs server and uses the actual SDK to verify login, draft isolation, publication, persistence across a storage-server restart, media upload/read/ranges and logout. Neither local test proves hosted deployment configuration. GitHub Actions runs tests, build and file checks on pushes and pull requests. Run the hosted checklist below after first deployment.

### Hosted acceptance checklist

- Confirm `/`, `/blog/` and a directly loaded `/blog/<published-slug>` work on your domain.
- Configure the admin hash; confirm incorrect password rejection and signed-in editor access.
- Save clinic settings and verify the public contact section.
- Save a draft, confirm it is absent publicly, publish it, then unpublish it.
- Add treatments and confirm related-treatment links/filtering.
- Upload an image, add it to an article, and confirm deleting the referenced file is blocked.
- Import your real Naver RSS, review the draft and import again to confirm deduplication.
- Log out and confirm protected API access fails. Redeploy and confirm settings/articles/media persist.
- Review clinic copy and published medical information before release.

## Supplied assets

- `public/assets/doctor.png`: supplied SooProfileImage.png, preserved as PNG.
- `public/assets/interior.jpg`: optimized from supplied InteriorProductshot.png at 1920px width.
- `public/assets/intro.mp4`: optimized from supplied INTRO_1.mp4, 1280px wide, H.264, fast-start, **no audio track**. Original source remains untouched.

The original 68 MB video and 8.9 MB interior PNG are not duplicated in the ZIP; optimized website assets are included. The turquoise logo and teal/mint palette come from your supplied reference HTML. The older embedded portrait in those references is not used. Article pages include a current-portrait author row, an automatic contents list from heading sections, callouts, checklists, related-treatment cards and other published stories. There are no stock patient photos, invented testimonials or invented treatment outcomes. No prior repository was available for content migration.

## Platform references

[Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) · [Functions API](https://docs.netlify.com/build/functions/api/) · [Function limits](https://docs.netlify.com/build/functions/configuration/) · [Rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/)

## Version 3: Korean studio, vector branding and consultation access

The supplied SooKoreanMedicineLogo.svg is used as the header logo and favicon, replacing the small JPEG. The Korean clinic name and English subline use a compact aligned lockup. Noto Sans KR Variable is served locally using unicode-range WOFF2 subsets; only needed subsets load. Its font license is generated in `dist/assets/fonts/OFL.txt` at build time. Studio labels, messages, section names, buttons and validation feedback are Korean. Uploaded filenames and the clinic's English brand name retain their original text.

The public footer no longer has an admin link. To enter the studio, type `admin` in the consultation form's **연락처** field and click **상담신청**. This check runs before ordinary form validation and sends no inquiry request. It navigates to the same password-protected `/admin/` route; it does not log anyone in. Direct `/admin/` access still requires authentication.

Normal consultation requests require name, a valid telephone number, a topic and consent. They are stored privately in the same persistent CMS store and appear in **상담신청 관리**. Staff may mark a request as checked or delete it. No email or SMS notification integration is configured; staff check the studio list. Requests expire after 30 days, become inaccessible through the studio, and are physically deleted by the next scheduled daily cleanup. Anonymous visitors cannot list or read them. Same-origin validation and a five-submissions-per-IP/15-minute bucket rate limit apply.

The consultation form is part of the landing page, not a slide-in panel. Full Naver importing, shared media, article sections and related treatments from v2 remain included. Replacing source files on the same Netlify site keeps the same Blobs store names.

## Version 4 fixes

The importer now fetches the original article through `https://blog.naver.com/PostView.naver?blogId=…&logNo=…`. The mobile article host timed out in the local runtime even though RSS worked. Both a native server-fetch test and the actual running CMS endpoint now successfully import the tested article with all four images. Image failure handling remains separate: an image failure produces a visible placeholder/warning rather than failing the entire text import. Hosted Netlify connectivity is still a post-deployment acceptance check.

The doctor portrait is anchored to the lower edge of the mint section on desktop and mobile. Bottom section padding and the floating-image background/rounding were removed, while the introduction copy retains its own spacing.

## Version 5: visual block editor and image layout

- The icon sidebar inserts blocks at the selected position. Click a small plus between blocks to select an insertion point. Drag the dotted handle to reorder; pointer dragging supports touch and scrolling. Up/down buttons remain available for keyboard use. Blocks can be duplicated or removed.
- Text is edited directly in the canvas. Select text, then use the toolbar for bold, italic, underline, highlight, brand/accent color, or clearing formatting. Block alignment is configurable. Quotes support line, large-quotation and plain variants. Divider, spacer and safe link-button blocks are included.
- Media selection uses searchable thumbnail cards instead of filename dropdowns. The same library is used for body images, covers and homepage media.
- Every article image defaults to a maximum height of 450px. Per-section height is adjustable between 100 and 1200px. Left/center/right preserve the whole image at its original ratio and do not enlarge small originals. Fill uses a full article viewport width, preserves proportions with centered cropping, and respects the chosen height (or smaller source height). In the editor/preview, fill uses that canvas width so it does not overflow the dialog.
- Body-image AI disclosure is set per section; article-cover AI disclosure has its own checkbox. Badges appear in article content and its preview, never on blog-list or homepage card thumbnails. Flags are manual; the importer does not infer AI use from filenames.
- Editor blocks, preview and published articles use the same image renderer. Uploaded media files are not resized or altered when changing section settings.
- The public header background spans edge to edge, with a constrained padded inner row.

Existing sections remain compatible. New Naver imports also preserve supported inline emphasis, color/highlight mapping, paragraph alignment and quotation variants. To refresh formatting in an older imported article, first save it as a draft and deliberately use the full-body replacement control; existing edits are not overwritten automatically. The available color palette and typefaces are the clinic's, rather than an exact reproduction of every Naver visual style.

## Version 6: small GitHub browser-upload package

Only one main font family is used throughout the site and studio: **Noto Sans KR Variable**. Heading/body differences use weights and sizes, not additional downloaded typefaces. System fonts are fallbacks only.

The previous ZIP contained 124 Korean unicode font subset files. Those were parts of a single typeface, not 124 separate font families. They are now supplied from the locked font package during `npm run build`. Generated font binaries are excluded from source uploads. Netlify still serves the font locally after building; no Google Fonts/CDN request is required in the visitor's browser.

Upload **all contents** of the extracted `soo-clinic` folder to the repository root, preserving folder structure, including package.json, package-lock.json, netlify.toml, public/, netlify/ and scripts/. Do not upload only public/, and do not put the ZIP itself into GitHub. The complete source package is below GitHub's 100-files-per-browser-upload limit. See UPLOAD-TO-GITHUB.md.

A local development launch now builds first and serves dist/. Rebuild after source edits when using the simple static preview. Font licenses are retained in the deployed output. Existing CMS articles, reusable uploads and Naver image copies remain in Netlify Blobs; they are not added to the source ZIP or GitHub with each import. The storage names and content format have not changed.

## Version 7: paragraph spacing and selection-based formatting

Naver paragraphs now retain single line breaks and intentional empty paragraphs instead of inserting a blank line after every paragraph. Editor and article body share 1.8 line-height. Existing saved imports are not silently rewritten: open the article, save any current edits, choose **원문 줄 간격 맞추기**, review the preview, then save. Only sections whose wording still matches the source receive whitespace repairs; text edits and formatting are retained. This operation returns an unsaved review copy, including for published articles.

Bold, italic and underline toggle the selected text. Toolbar states reflect selected marks, including mixed selections. Text and highlight colors accept a six-digit hex color or the native color selector. Brand-friendly palettes, recent colors and favorites are stored in that browser. **Tx** removes all selected inline styles and links and restores the default body text style. Undo/redo and keyboard shortcuts are available within each text block. Cross-block reordering remains separate from text editing.

Imported related links show a locally stored thumbnail, title, 30-character excerpt and short address. For a manually added link, paste a public Naver article URL and choose **네이버 링크 정보 가져오기**. Review or edit the title/description and choose another reusable thumbnail before saving. Automatic metadata fetching accepts only public Naver article URLs and allowlisted Naver image hosts. Unavailable thumbnails leave a link fallback. TalkTalk widgets become clean branded buttons without tracking URLs in the body. Map/video widgets are not exact Naver replicas.

## Version 8: article header

Article pages and article previews show the title followed by body sections, without automatically inserting the listing excerpt or cover. Author details and category remain on the public header. Excerpts and covers remain available for list cards and metadata. Body images appear only where their sections place them.

## Version 9: older Naver posts

The RSS option remains a recent-post list (up to 20). **전체 글 목록 불러오기** reads the public desktop category pages sequentially with progress, deduplicates URLs and marks existing imports. Category 9 is this clinic's 내과 클리닉; 0 requests the whole blog. The list operation does not import or publish articles. On a page failure it preserves results and offers resume. Per-page requests validate identifiers and numbers, have size/time limits, and target only blog.naver.com with redirects disabled. Naver may change its page markup; unsupported responses fail visibly rather than reporting a complete archive.

Verified against the real category: 13 pages, 127 distinct links (12 pages of 10 and a final page of 7). Listing works independently of RSS. Full-body/media import remains per selected article.

## Version 10: listing cards

Titles and summaries clamp to two lines. Mobile cards use one column up to 800px. Thumbnails use a stable 4:3 frame with contain fitting, preserving the complete original image without stretching or cropping; mint space fills mismatched proportions. The first card no longer spans multiple columns.

## Version 11: approved thumbnail crop

Article listing thumbnails use a fixed 4:3 frame with object-fit: cover and centered cropping, filling edge to edge. This supersedes version 10 contain fitting. Two-line titles/summaries and one mobile column remain.

## Version 12: hero video hydration

Settings no longer reassign the same video source after HTML autoplay starts. The built-in video uses its own first frame as poster, rather than the unrelated interior photo. Switching to an uploaded video removes that built-in poster; reduced-motion and manual pause are preserved. Browser refresh checks confirm ready/playing with no redundant src assignment. 56 tests pass.

## Version 13: website editor and private inquiry email

**홈페이지 편집** groups landing-page copy, common navigation/branding, hero, doctor introduction, treatment heading and three process steps, journal headings, contact/hours/directions/parking/map links, consultation form labels/privacy copy, photos/video and browser search descriptions. Existing treatment entries remain in 관련 진료 관리. Editable copy is plain text, never executable HTML. Existing settings gain new defaults without losing saved values. Menu/brand/footer updates apply to the homepage, blog list and article pages.

**저장 전 미리보기** validates inputs without saving, then opens an actual homepage preview using a random browser-local draft ID that expires in ten minutes. The banner identifies preview mode and consultation submission is disabled there. Preview URLs work only in that browser. **홈페이지 변경 내용 저장** applies changes immediately; this is a content editor rather than a drag-and-drop page layout designer.

**상담신청 이메일 알림** supports a private recipient, enable switch, server-configuration status and a rate-limited test-send button. Recipient settings are excluded from the public settings endpoint and from preview data. Mail is sent server-side through Resend; secret credentials never enter studio/browser code. The notification contains an admin link and receipt ID, with contact details available inside the password-protected studio. Inquiries are stored before notification attempts; provider failures do not discard submissions. Staff see notification status on each inquiry. "발송 요청 완료" means provider acceptance, not guaranteed inbox delivery. No real email was sent during development; provider tests use simulated responses.

### Email setup without a terminal

1. In Resend, verify a sending domain and create an API key. Use a sender address on that verified domain. See https://resend.com/docs/dashboard/domains/introduction and https://resend.com/docs/api-reference/emails/send-email .
2. In Netlify, open the site's Project configuration → Environment variables. Add `RESEND_API_KEY` (the Resend key) and `INQUIRY_FROM_EMAIL` (the plain verified sender address, e.g. notifications@your-domain.example), with Functions scope and the Production deploy context. Do not put real values in GitHub or this ZIP.
3. Redeploy the site from Deploys so Functions receive the new environment. The existing admin-password configuration stays as it is.
4. In the studio, open 홈페이지 편집 → 상담신청 이메일 알림. Set the recipient, enable email, save, then use 저장된 주소로 테스트 메일 보내기. Confirm receipt in the inbox/spam folder. Configure separate credentials for preview contexts if you want preview deployments to send mail.

Email remains off by default. Until configured, inquiries continue to appear in 상담신청 관리. Automatic sending is bounded by the existing inquiry rate limit, has an eight-second timeout, no redirects, and uses idempotency per inquiry. Test email is capped at three requests per 15 minutes per IP. No public email endpoint accepts caller-supplied recipients.

## Version 14: related treatments, notices and storage visibility

Article related treatments use an expandable picker with + 새 진료 추가 at the top, checkboxes and inline editing. The modal saves a treatment independently without leaving the article. New treatments are linked immediately in the local article draft; save the article to persist its links. Private treatments remain hidden publicly until published. Unsaved article text is retained while using the modal.

Navigation/editor changes clear stale status notices; errors also expire after ten seconds. Replacing Naver body content still requires an existing saved draft and deliberately confirmed replacement. Edited cover and cover AI flag now survive a full-body refresh. The importer chooses the first body image as the initial cover; older Naver listing thumbnails may be editorially different. Select a different 대표 이미지 manually from reusable media or upload it.

공용 미디어 displays recorded upload count and total media bytes. This is not an account quota meter: it excludes built-in repository assets, JSON content/metadata, traffic and other projects. In production, CMS content/settings and media records are stored in soo-cms-v1; image/video bytes are in soo-media-v1 on Netlify Blobs. Local preview uses .netlify/blobs-serve and does not share production data. Deploy previews use isolated stores. GitHub holds source and bundled assets, not live CMS changes.

For current account allowance, Netlify team dashboard → Usage & billing → Credit balance / Account usage insights. Account plan determines actual limits. See https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/monitor-usage-for-credit-based-plans/ . No automatic migration to another storage provider is included.

## Version 15: optional R2 media, image optimization and usage panel

Article/settings text remains in Netlify Blobs. New media can be written to a dedicated Cloudflare R2 Standard bucket. Existing Netlify media remains readable; no automatic deletion or bulk migration occurs. Media URLs in articles remain stable `/api/media/<id>` paths. With a custom R2 image domain configured, those routes redirect R2 files to Cloudflare and retain legacy Netlify reads. Without that domain, R2 files are proxied through Netlify, which still uses Netlify transfer/compute allowance. Cloudflare recommends custom domains for production caching rather than r2.dev.

### Connect R2 without putting secrets in GitHub

1. Activate R2 yourself; the subscription is pay-as-you-go beyond its free allowances. Use **Standard**, not Infrequent Access. Use the private bucket configured for the site. The bucket name in the examples is a placeholder.
2. Create an R2 account token with **Object Read & Write**, restricted to the clinic’s bucket only. Do not use account-wide Admin permissions. This needs account-owner confirmation because it grants new persistent access. Store the Access Key ID and Secret Access Key only in Netlify environment variables; never paste them into public files or chat.
3. In Netlify's project environment variables, set `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` for Production / Functions. Set `MEDIA_STORAGE=r2` only when ready. The environment defaults to Netlify until selected and complete. Local dev and deploy previews deliberately keep isolated Netlify media stores, avoiding production R2 writes.
4. For direct image delivery, attach a dedicated image subdomain to this bucket in Cloudflare (for example `images.<your-domain>`), with a cache rule for `/media/*`. Only clinic media belongs in this publicly readable bucket; no patient inquiries or private CMS records are copied. Public-read configuration needs explicit approval. Set `R2_PUBLIC_BASE_URL=https://images.<your-domain>` in both Builds and Functions scopes, then redeploy. Build generates CSP permitting that one exact origin, not arbitrary external images. Do not set a development r2.dev host as a production caching substitute.
5. Open 공용 미디어 in the studio. Check provider, current bucket bytes, optimization savings, and connection status. Upload a small test image and confirm it loads. Test a single old file with **R2로 복사** before migrating more. References do not change, and the Netlify original is retained for safety. Do not remove legacy copies before checking the live articles.

### Storage and request monitoring

The panel shows recorded media totals and, when connected, a paginated live R2 bucket-size measurement cached for up to 60 seconds. **8 GB** is this app's upload protection budget, leaving headroom below the 10 GB-month Standard free storage allowance. This is not an atomic account-wide quota or billing cap: concurrent writes, other buckets, out-of-app uploads and monthly operations can still affect billing. Upload/import/migration writes check the bucket measurement and reject further writes near that budget; listing failures also stop writes. No automatic escalation to a paid plan is implemented, but R2 itself is already usage-billed by Cloudflare.

The panel's Cloudflare link is the authority for account-wide storage, monthly Class A/B operations and billable use. S3 object credentials do not grant account billing/analytics access, so monthly request counts are intentionally not fabricated in the studio. Check those in Cloudflare and configure its account budget alerts; spending alerts notify, not cap charges. R2 free allowances and pricing: https://developers.cloudflare.com/r2/pricing/ . Public bucket/domain guidance: https://developers.cloudflare.com/r2/buckets/public-buckets/ .

### Automatic compression

New JPEG, PNG and single-frame WebP images—including Naver body and related-link images—are rotated according to orientation, resized inside 1600×2400 without enlargement/cropping, and encoded as WebP at quality 84 when smaller (or when large dimensions must be reduced). Existing small originals are retained if conversion would increase file size. Animated images/GIF and videos are preserved. Original upload limit remains 4 MB. Files that cannot be decoded for optimization retain the existing signature-validated upload behavior; the panel does not claim savings for them. Original bytes are not kept for new optimized uploads; existing Netlify originals remain for copied files. Large images containing fine text should be visually reviewed after importing. Sharp is packaged as a native external dependency for Netlify; Linux binaries are installed during Netlify's build.

No live R2 token has been created, secret installed, public access enabled, or production media migrated during preparation. The source is tested against a simulated S3 client and real local Netlify Blobs; a live connection test is still required after credentials and domain are configured.

### Local next version: media folders and photo uploads

The media library supports persistent named folders, renaming, folder filtering in the article picker, and moving uploaded files without changing URLs. Deleting a folder retains its files in 미분류. Folder metadata stays in the protected CMS store; these are library categories, not public URL directories. Included source assets remain managed in GitHub.

파일 업로드 opens the computer picker and immediately processes selected files sequentially into the selected folder. JPEG/PNG/static WebP originals up to 50 MB can be selected. The browser preserves orientation/transparency and compresses to WebP with a 2400px long-edge bound before the existing 4 MB server request limit. Server optimization then applies the existing bounds. Conversion is visually optimized, not lossless, and does not retain the large original. GIF, animated WebP, MP4 and WebM retain the 4 MB upload limit; unsupported HEIC requires conversion first. Success notices expire after five seconds; errors after ten seconds, and navigation clears both.

Verified locally with a 9,312,176-byte interior PNG: selected through the single upload button, stored at approximately 72 KB in its chosen folder, and found through the article picker folder filter. 71 automated tests pass, plus build and source checks. These changes have not been deployed to the live v13 website.

### Local review: folder-first browsing and editor uploads

Both the library and the image picker show folder cards with file counts, then a thumbnail grid inside a folder, with a back-to-folders control. Source assets have their own 기본 이미지 folder; uncategorized uploads are in 미분류. The picker remembers its last folder in browser-tab session storage, shared by image fields, and clears this preference on logout. Upload from the picker saves into the open folder (or 미분류 from the root/source-assets folder), refreshes the thumbnail choices, and lets the author deliberately select the new image.

Body-image sections also accept public HTTPS image links after a successful browser preview. External image URLs remain external, are not copied to storage, and can be blocked or deleted by their hosts. Images use no-referrer requests. The server does not fetch arbitrary pasted URLs. Homepage media, article covers and link thumbnails still use library files. The generated image CSP permits HTTPS image sources while scripts and connections remain restricted to self. Local checks verified folder navigation, remembered picker location, direct picker upload, and external preview/rendering. 72 tests pass with build and source checks. Live v13 is unchanged.

### Local review: conservative Naver highlights and text toolbar

Naver background colors are parsed as explicit declarations. Only recognizable colored backgrounds on inline text (or mark tags) become highlights; transparent, white/near-white, grayscale, container backgrounds and uncertain syntax are skipped. This fixes the previous regex's whitespace backtracking false positives. Existing imported records are preserved; review a draft and deliberately reimport to use corrected source parsing.

Text alignment is controlled by pressed-state toolbar buttons instead of a separate dropdown. Body sections support checklist, bullet and numbered modes via toolbar toggles, applying to that whole body block; use separate body blocks for mixed paragraph/list layouts. Inline formatting is retained in the rendered list. Legacy checklist blocks stay readable and become body checklist blocks when edited. Checklist markers are presentation, not patient task tracking. Related links have image/icon display modes and a locally served, allowlisted Lucide/Feather icon palette. ICON-LICENSE.txt retains ISC/MIT notices. No external icon script or arbitrary uploaded SVG is used.

75 automated tests, build and source checks pass. Local browser checks verified active alignment/list toggles, removal of the separate alignment selector/checklist insertion tool, icon selection and preview rendering. Live v13 remains unchanged.

### Local review: related treatments as tags

Treatments are now name-only tags without draft/public controls or introduction fields. The public tag endpoint includes legacy draft names immediately but omits old descriptions and section bodies. Existing article associations and tag slugs are retained. Public articles display linked tags above the title; a tag opens the blog with that filter selected. Homepage treatment names also link to filtered articles. The editor preview includes selected tags. Creating a tag makes it available immediately; attaching/removing it on an article still requires saving the article. Unpublished articles remain private. 76 tests pass; live v13 is unchanged.

## Local review release v16 — November 2, 2026

Includes all preceding local editor/media/tag improvements, enlarged supplied doctor portrait, editable 약력·학술활동·저술논문, business-card contact information, and the working Kakao rough-map embed. The homepage video is a silent 30-second 1280×720 loop (1,909,288 bytes); the 818 MB original and compressed full-length review copy stay outside the deployment package.

Homepage editor and public site use the same values. Existing v13 settings receive this release's doctor name, credentials, phone, address, hours, directions, map, portrait and video. Other saved wording, articles, uploaded media and private email configuration are preserved. Saving 홈페이지 편집 marks the update applied, and subsequent edits are retained. The ZIP contains no local test articles, credentials, tokens, node_modules, generated font subsets or local storage. Keep existing Netlify environment variables and deploy from the same project to retain its data.

Kakao map runs in an isolated sandboxed frame with HTTPS resources; map directions also remain available as a normal external link. Verified the clinic marker and actual map tiles in the local homepage. Map renderer version is pinned to the official public renderer generated on November 2; if Kakao retires it, regenerate the rough-map embed and update its renderer version.

Deploy only when ready. Live Netlify v13 has not been changed.

## v17 contact and Naver import update

Open `/admin/` directly to sign in. In 홈페이지 편집, 공통 메뉴·브랜드 contains the representative, business registration number, and Naver TalkTalk URL. The footer omits the business number until it is entered. Visitors can call or open TalkTalk from 오시는 길. The embedded map and Kakao directions link remain available.

Naver imports reuse images with the same source or identical downloaded bytes. Existing media and articles stay intact. New imports preserve inline text emphasis and omit background highlights. To correct highlights in an existing article, clear the affected formatting in the editor or review a fresh import before replacing the draft body.
