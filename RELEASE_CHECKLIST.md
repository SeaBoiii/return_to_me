# Production release checklist

This checklist records the human approvals that automation cannot infer. Keep every box unchecked until the named review has actually happened.

## Story and privacy

- [ ] Aleem has completed the factual and tone read-through.
- [ ] Alya, Hana, Syafiqa, Mei Lin, Nadiah, Aisyah, Hakim, Jia Wen, Claire, Imran, Kak Mariam, and Abang Yusuf remain empathetic pseudonymous portrayals rather than villains or stepping stones.
- [ ] Schools, badges, exact grades, and personal identifiers remain absent.
- [ ] Family pressure, repeated rejection, relationship breakdown, withdrawal, examination setbacks, and Aleem's university physical symptoms do not invent a diagnosis, self-harm, or unremembered severe events.
- [ ] Younger Aleem's generalisation about Malay girls is explicitly identified as unfair while his wish for direct communication remains legible.
- [ ] Daniel and Mei Lin's supposed boundary remain an unconfirmed inference rather than a remembered fact.
- [ ] Jia Wen's question remains unresolved; friendship and effort are not presented as mutual commitment.
- [ ] Claire's particular religion remains unspecified; the Umrah journey follows the confirmed order of Makkah, then Madinah.
- [ ] The Jabal Nur group goes from five to two without an invented arrangement, cave entry, or detailed ritual sequence. Jabal Rahmah's association with Adam and Hawa is framed as a tradition Aleem knows.
- [ ] Nadiah's hesitation and longing remain Aleem's inference; no admission, messages, or evidence about another man are invented.
- [ ] The private doa in Masjidil Nabawi reconstructs its meaning rather than claiming verbatim memory. Relief and Aleem's quiet decision remain fixed across choices.
- [ ] Mariam’s introduction opens **A New Book**. The finale follows the remembered order: messages, Yakiniku, repeated meetings, “what’s next,” Kazakhstan, parents’ dinner, and the following weekend’s Kallang River confession.
- [ ] Nurul’s early impressions are attributed to what she later told Aleem. “Narcissist” remains a first impression rather than a diagnosis; both characters’ feelings and growth remain legible.
- [ ] The three final reflective choices reconverge before fixed events; both confess love, and the epilogue ends engaged and preparing for a future wedding without inventing a proposal or ceremony.
- [ ] Nadiah's acknowledged first-love history is distinguished from Aisyah's report, Aleem's direct observations, and Aleem's interpretation that he was a backup.
- [ ] Nadiah's hijab is never treated as a moral barometer, and no motive is assigned to her not wearing it in the private-story image.
- [ ] The other man's Chinese ethnicity is reported only as part of Aleem's remembered account and is never framed as causal, threatening, or morally meaningful.
- [ ] The Muslim Society and its university crowd remain neutral and welcoming; the threat scan is explicitly Aleem's subjective and unfair verdict.
- [ ] Reconstructed dialogue and composite relationship memories are disclosed rather than presented as verbatim records.
- [ ] Nurul is portrayed as a person with her own feelings and pace, and is not framed as a cure or reward.

## Character and scene art

- [x] Primary 6 Aleem and Alya identity/style proof approved.
- [x] Secondary-uniform Aleem, home-clothes Aleem, Hana, and Faris anchors approved.
- [x] JC Aleem, Syafiqa, Mei Lin, and the bus-interior proof batch approved before generating expression variants.
- [ ] Chapter 6 Aleem, wholly fictional Nadiah, National Service, Hari Raya, and university environment proofs approved before promotion.
- [ ] Chapter 6 CG proofs approved for balanced warmth, neutral reveal framing, and an unnamed, distant, unidentifiable other man.
- [ ] Final JC character canvases preserve Aleem, Syafiqa, and Mei Lin's intended relative heights in-game.
- [ ] JC chroma-key removal uses tolerant matting and spill cleanup, with light/dark composite QA; green clothing is handled with a non-green mask or true alpha.
- [ ] Every background and CG reviewed for period cues, composition, and story tone.
- [ ] Expression variants checked for identity, age, outfit, body shape, hair, and glasses consistency.
- [ ] Adulthood artwork reviewed: 26 sprites, 11 backgrounds, and two CGs; Jia Wen reads shorter than Aleem.
- [ ] `npm run art:adulthood:validate` passes; light/dark contact sheets and desktop/mobile scenes reviewed.
- [ ] Umrah artwork reviewed: 16 sprites, seven backgrounds, and three CGs; adult Aleem and Nadiah retain their identities, and Mariam and Yusuf have distinct adult designs.
- [ ] `npm run art:umrah:validate` passes; light/dark edges, stature, desktop/mobile framing, and offline loading of all 26 assets reviewed.
- [ ] Finale artwork reviewed: seven Nurulain sprites, four backgrounds, and three CGs. Her full hijab, loose opaque clothing, bright smile, skin tone, and 165 cm stature beside 183 cm Aleem match the author’s description; her parents’ restaurant portrayal is consistent.
- [ ] `npm run art:finale:validate` passes; light/dark contact sheets, desktop/mobile framing, and offline loading of all 14 assets reviewed.
- [ ] Transparent edges checked on light and dark stages, especially long, braided, and fluffy hair.
- [ ] No real badge, unit insignia, university identifier, readable generated text, watermark, trademark, copied Minecraft asset, screenshot, texture, social-media interface, logo, or handle is present.
- [ ] The lecture-theatre art is objectively ordinary and welcoming; subjective red fragments exist only in the runtime `intrusive` overlay.
- [ ] Nadiah's non-hijab appearance occurs only in the reveal CG with neutral clothing, lighting, and pose and no visual moral judgement.
- [ ] HTML SMS, server, results, social, and intrusive overlays remain legible with screen readers and at mobile sizes; intrusive motion becomes static under reduced motion.
- [ ] `npm run art:chapter-six:check` passes and all nine Chapter 6 QA sheets have been reviewed at full size before promotion.

## Release format

Choose one publication path and complete only its checks.

### Subtitles-only edition

- [ ] Production voice entries and offline voice packs are empty.
- [ ] Credits and the offline manager clearly identify the edition as subtitles-only.
- [ ] Every line can be read and advanced with voice replay unavailable.

### Fully voiced edition

- [ ] Every non-cloned synthetic profile in the active speaking cast is approved and age-appropriate.
- [ ] Provider licenses permit synthetic performance, redistribution, public web delivery, and offline caching.
- [ ] Every profile and clip has a publishable license/provenance reference with no secret or personal data.
- [ ] `npm run voices:check -- voice-production/production.voice-import.json` passes.
- [ ] `npm run voices:import -- voice-production/production.voice-import.json` completes without warnings.
- [ ] `npm run validate:release` passes with complete spoken-line coverage.
- [ ] Synthetic-voice disclosure and generated provider/license records display correctly in Credits.

## Quality and deployment

- [ ] Desktop keyboard and mobile touch play-throughs completed.
- [ ] Autosave, Continue, chapter unlocks, history, settings, auto, seen skip, voice replay, and reset checked manually.
- [ ] v5 introduction/ending saves resume at **A New Book**, earlier replay positions and choices survive, older editions resume their first unread expansion, and the completed v6 ending persists across reloads.
- [ ] Install, offline shell, and update prompt checked in a production preview; for a voiced edition, chapter voice download, cancellation, retry, verification, and removal are also checked.
- [ ] `npm ci`, `npx playwright install chromium`, and `npm run check` pass from a clean checkout.
- [ ] `npm run validate:deploy` passes for the selected release format.
- [ ] The approved Chapter 6 manuscript/tone review, character/environment proof approval, full art QA, and explicit promotion gate are recorded.
- [ ] A GitHub Pages production build has been checked at the repository subpath with all Chapter 6 art and PWA metadata loading correctly.
- [ ] GitHub Pages source is set to GitHub Actions and the `main` deployment succeeds at its repository subpath.
