import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { story } from "../src/story";
import { voiceProfiles } from "../src/voices";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputRoot = resolve(projectRoot, "voice-production/development");
const outputPath = resolve(outputRoot, "jobs.json");
const NORMALIZATION_REVISION = "sapi-softclip-binary-v1";

const sapiSettings = {
  "adult-aleem": { engineVoice: "Microsoft David Desktop", rate: -2 },
  "young-aleem": { engineVoice: "Microsoft David Desktop", rate: 3 },
  "teen-aleem": { engineVoice: "Microsoft David Desktop", rate: 0 },
  alya: { engineVoice: "Microsoft Zira Desktop", rate: 2 },
  hana: { engineVoice: "Microsoft Zira Desktop", rate: -1 },
  faris: { engineVoice: "Microsoft David Desktop", rate: 2 },
  "mutual-friend": { engineVoice: "Microsoft Zira Desktop", rate: 0 },
  syafiqa: { engineVoice: "Microsoft Zira Desktop", rate: 0 },
  "mei-lin": { engineVoice: "Microsoft Zira Desktop", rate: -1 },
  "aleem-adult": { engineVoice: "Microsoft David Desktop", rate: 0 },
  "jia-wen": { engineVoice: "Microsoft Zira Desktop", rate: 1 },
  claire: { engineVoice: "Microsoft Zira Desktop", rate: 0 },
  imran: { engineVoice: "Microsoft David Desktop", rate: -1 },
} as const satisfies Record<
  (typeof voiceProfiles)[number]["id"],
  { readonly engineVoice: string; readonly rate: number }
>;

const profileBySpeaker = new Map<string, (typeof voiceProfiles)[number]>(
  voiceProfiles.map((profile) => [profile.speakerId, profile]),
);

const profiles = voiceProfiles.map((profile) => {
  const settings = sapiSettings[profile.id];
  return {
    id: profile.id,
    speakerId: profile.speakerId,
    displayName: profile.displayName,
    engineVoice: settings.engineVoice,
    rate: settings.rate,
    provider: "Microsoft Windows SAPI (development placeholder)",
    licenseReference:
      "DEVELOPMENT-ONLY: bundled voice redistribution rights not cleared",
  };
});

const jobs = story.nodes.flatMap((node) => {
  if (node.type !== "line" || node.speakerId === null) {
    return [];
  }
  const profile = profileBySpeaker.get(node.speakerId);
  if (profile === undefined) {
    throw new Error(`No voice profile exists for speaker ${node.speakerId}.`);
  }
  const settings = sapiSettings[profile.id];
  const fingerprint = createHash("sha256")
    .update(
      [
        story.revision,
        node.id,
        node.chapterId,
        node.speakerId,
        profile.id,
        settings.engineVoice,
        String(settings.rate),
        NORMALIZATION_REVISION,
        node.text,
      ].join("\0"),
    )
    .digest("hex");
  return [
    {
      lineId: node.id,
      chapterId: node.chapterId,
      speakerId: node.speakerId,
      profileId: profile.id,
      text: node.text,
      outputFile: `clips/${node.id}.mp3`,
      fingerprint,
    },
  ];
});

const proofLineIds = voiceProfiles.map((profile) => {
  const proofJob = jobs.find((job) => job.profileId === profile.id);
  if (proofJob === undefined) {
    throw new Error(`No spoken line exists for voice profile ${profile.id}.`);
  }
  return proofJob.lineId;
});

await mkdir(outputRoot, { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      storyId: story.id,
      contentRevision: story.revision,
      developmentOnly: true,
      normalizationRevision: NORMALIZATION_REVISION,
      proofLineIds,
      profiles,
      jobs,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

process.stdout.write(`Wrote ${jobs.length} development voice jobs to ${outputPath}.\n`);
