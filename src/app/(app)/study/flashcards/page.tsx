import { flashcards } from "@/lib/content";
import FlashcardSession from "./FlashcardSession";

export default function FlashcardsPage() {
  return <FlashcardSession cards={flashcards} />;
}
