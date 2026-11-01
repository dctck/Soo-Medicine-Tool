# Upload the complete website to GitHub

1. Download a backup of your current repository before replacing the old website files.
2. Extract the v6 ZIP. Open its `soo-clinic` folder.
3. Select everything **inside** that folder, including public, netlify, scripts, tests, the root files and hidden files. On Mac, press **Command + Shift + .** to show hidden files such as `.github`, `.gitignore` and `.env.example`.
4. In the existing GitHub repository, use **Add file → Upload files** and drop those selected contents. Keep the folder structure. Commit the changes to the branch connected to Netlify.
5. Confirm package.json and netlify.toml are at the repository's top level, alongside public/ and netlify/. Avoid an extra nested soo-clinic/ folder.
6. Remove obsolete files from the old website after backing them up. Preserve unrelated project files. Do not delete the GitHub repository or the existing Netlify site.
7. Netlify builds the site using `npm run build` and serves `dist`. Font assets are created automatically from the locked dependency.

Uploading only public/ is insufficient: it omits the CMS backend and deployment configuration. Uploading a ZIP file to GitHub does not extract or deploy its contents.

The generated dist/, node_modules/, .netlify/ and font asset cache are intentionally excluded from the source package. Naver-imported images and CMS uploads live in Netlify Blobs after import, not in this repository. Keeping the same Netlify site preserves those stores.

If you already uploaded some font files from a previous package, they are no longer required in public/assets/fonts/. The build ignores that old source cache and generates current font assets into dist/.
