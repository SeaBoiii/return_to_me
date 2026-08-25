import type { ChapterDefinition, SpeakerDefinition } from "../engine/types";

export const STORY_REVISION = "school-years-2.0.0";

export const speakers = [
  {
    id: "adult-aleem",
    name: "Aleem",
    shortName: "Aleem",
    role: "narrator",
  },
  {
    id: "aleem-p6",
    name: "Young Aleem",
    shortName: "Aleem",
    role: "character",
  },
  {
    id: "aleem-sec",
    name: "Teenage Aleem",
    shortName: "Aleem",
    role: "character",
  },
  {
    id: "alya",
    name: "Alya",
    role: "character",
  },
  {
    id: "hana",
    name: "Hana",
    role: "character",
  },
  {
    id: "faris",
    name: "Faris",
    role: "character",
  },
  {
    id: "mutual-friend",
    name: "Mutual Friend",
    shortName: "Friend",
    role: "character",
  },
  {
    id: "syafiqa",
    name: "Syafiqa",
    role: "character",
  },
  {
    id: "mei-lin",
    name: "Mei Lin",
    role: "character",
  },
] as const satisfies readonly SpeakerDefinition[];

export const chapters = [
  {
    id: "prologue",
    title: "Before Nurul",
    period: "Years later",
    startNodeId: "prologue-001",
  },
  {
    id: "chapter-1",
    title: "The Wrong Message",
    period: "2009–2010",
    startNodeId: "ch1-001",
  },
  {
    id: "chapter-2",
    title: "A Different Classroom",
    period: "2011–2013",
    startNodeId: "ch2-001",
  },
  {
    id: "chapter-3",
    title: "The Bus We Waited For",
    period: "2014",
    startNodeId: "ch3-001",
  },
  {
    id: "chapter-4",
    title: "Looking for an Answer",
    period: "2014–2015",
    startNodeId: "ch4-001",
  },
  {
    id: "chapter-5",
    title: "The Zoo After Results",
    period: "2016",
    startNodeId: "ch5-001",
  },
  {
    id: "epilogue",
    title: "Fault Lines",
    period: "After 2016",
    startNodeId: "epilogue-001",
  },
] as const satisfies readonly ChapterDefinition[];
