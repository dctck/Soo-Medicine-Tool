# Start here — latest upload-friendly package (v6)

1. Back up the existing website repository.
2. Extract the ZIP and open the `soo-clinic` folder.
3. Upload **everything inside that folder** to the existing GitHub repository root, preserving the subfolders. Do not upload the ZIP itself or only public/.
4. Keep the existing Netlify site. Build command: `npm run build`; publish directory: `dist`; base directory: repository root.
5. If this is the first deployment, run `npm ci` then `npm run password`, add the generated value as `ADMIN_PASSWORD_HASH` in Netlify environment variables (Functions scope), and redeploy. Existing configured password hashes can be retained.
6. Enter `admin` in the homepage consultation form's 연락처 field and click 상담신청, then sign in.

The package stays below GitHub's 100-file browser-upload limit. The Korean font is assembled during deployment instead of requiring 124 font files in GitHub. All v5 editor features and v4 Naver import fixes are included. Existing blog articles/images are in Netlify Blobs and are not part of the source upload.

See UPLOAD-TO-GITHUB.md for upload steps, README.md for deployment details, and 관리자-사용안내.md for the Korean staff guide.
