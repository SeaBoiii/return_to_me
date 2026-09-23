import type { ChapterDefinition, SpeakerDefinition } from "../engine/types";

export const STORY_REVISION = "school-years-6.0.0";

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
  {
    id: "aleem-adult",
    name: "Aleem",
    role: "character",
  },
  {
    id: "jia-wen",
    name: "Jia Wen",
    role: "character",
  },
  {
    id: "claire",
    name: "Claire",
    role: "character",
  },
  {
    id: "imran",
    name: "Imran",
    role: "character",
  },
  {
    id: "aleem-young-adult",
    name: "Young Adult Aleem",
    shortName: "Aleem",
    role: "character",
  },
  { id: "nadiah", name: "Nadiah", role: "character" },
  { id: "aisyah", name: "Aisyah", role: "character" },
  { id: "hakim", name: "Hakim", role: "character" },
  { id: "mariam", name: "Kak Mariam", role: "character" },
  { id: "yusuf", name: "Abang Yusuf", role: "character" },
  { id: "nurulain", name: "Nurulain", shortName: "Nurul", role: "character" },
  { id: "nurul-mother", name: "Nurul's Mother", role: "character" },
  { id: "nurul-father", name: "Nurul's Father", role: "character" },
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
    id: "chapter-ns",
    title: "The Story I Wasn’t In",
    period: "2016–2018",
    startNodeId: "ns-001",
  },
  {
    id: "chapter-6",
    title: "Almost Us",
    period: "University–December 2021",
    startNodeId: "ch6-001",
  },
  {
    id: "chapter-7",
    title: "Just Friends",
    period: "Working life · February 2023 onward",
    startNodeId: "ch7-001",
  },
  {
    id: "chapter-8",
    title: "A Different Journey",
    period: "January 2026",
    startNodeId: "ch8-001",
  },
  {
    id: "chapter-9",
    title: "The Same Girl",
    period: "Makkah · January 2026",
    startNodeId: "ch9-001",
  },
  {
    id: "chapter-10",
    title: "What I Could Finally Put Down",
    period: "Madinah · January 2026",
    startNodeId: "ch10-001",
  },
  {
    id: "chapter-11",
    title: "A New Book",
    period: "After Umrah",
    startNodeId: "ch11-001",
  },
  {
    id: "epilogue",
    title: "Still Being Written",
    period: "Engagement and wedding preparations",
    startNodeId: "epilogue-001",
  },
] as const satisfies readonly ChapterDefinition[];
