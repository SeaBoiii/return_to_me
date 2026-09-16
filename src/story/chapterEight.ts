import type { StageSnapshot, StoryNode } from "../engine/types";
import { line } from "./helpers";
import { adulthoodStages as stages } from "./adulthoodStages";

const beat = (id: string, stage: StageSnapshot, speaker: string, text: string, next: string) =>
  line(id, "chapter-8", stage, speaker, text, next);

export const chapterEightNodes = [
  beat("ch8-001", stages.journeyPrompt, "adult-aleem",
    "Just when I thought I had nothing left to ask for, a different thought settled in my heart: go to the holy land. It came quietly. No sudden certainty that everything would work out, no explanation for the years behind me. Only a pull towards somewhere I had wanted to go, for reasons deeper than this latest hurt.", "ch8-002"),
  beat("ch8-002", stages.journeyPrompt, "adult-aleem",
    "By January 2026, I was ready to listen to it. I wanted peace. Blessings. Space for doa, and the chance to bring the things I couldn't explain to God without first arranging them into a story that made me sound stronger than I felt.", "ch8-003"),
  beat("ch8-003", stages.journeyBooking, "aleem-adult",
    "Imran, I'm thinking of going for Umrah. Properly thinking about it. Would you come with me?", "ch8-004"),
  beat("ch8-004", stages.journeyBooking, "adult-aleem",
    "He was a good friend, the kind who could hear a serious question without immediately covering it with a joke. He asked about the trip, let me explain what I had looked at, and listened when I ran out of practical details and admitted I just needed to go.", "ch8-005"),
  beat("ch8-005", stages.journeyBooking, "imran",
    "Let's look at it together. You don't have to figure out everything by yourself.", "ch8-006"),
  beat("ch8-006", stages.journeyBooking, "adult-aleem",
    "That January, we booked the journey. Makkah and Madinah were names I had carried for years; now they were part of a trip I was actually making. I read the confirmation more than once. For the first time in a while, something ahead of me felt possible without depending on whether someone could love me back.", "ch8-007"),
  beat("ch8-007", stages.journeyPrompt, "adult-aleem",
    "Packing was ordinary enough to steady me. Clothes folded badly, documents checked, the charger I nearly forgot. I kept moving an item from one side of the bag to the other as if there were a perfect arrangement. The hurt was still there, but now my hands had something useful to do around it.", "ch8-008"),
  beat("ch8-008", stages.departure, "adult-aleem",
    "At the airport, Imran stood beside me while I checked my pockets again. Around us, people counted bags and called to family members. I had imagined leaving would feel momentous. Mostly, I felt tired, slightly nervous, and grateful that somebody knew where I was supposed to be.", "ch8-009"),
  beat("ch8-009", stages.departure, "imran",
    "Passport still there? Good. Come, let's go. One thing at a time.", "ch8-010"),
  beat("ch8-010", stages.departure, "aleem-adult",
    "One thing at a time I can do.", "ch8-011"),
  beat("ch8-011", stages.departure, "adult-aleem",
    "During the journey, I slept unevenly and woke with the old ache still familiar. Then I remembered where we were going. I didn't need to arrive as a repaired version of myself. I could arrive tired, carrying questions, wanting peace without knowing what peace would feel like.", "ch8-012"),
  beat("ch8-012", stages.arrival, "adult-aleem",
    "When we arrived in the holy land, I paused with my bag in my hand. Imran waited beside me. The air beyond the doors felt unfamiliar against my face. I was here. After all that thinking about leaving, all those small preparations, I had reached the beginning of this different journey.", "ch9-001"),
] as const satisfies readonly StoryNode[];
