import Image from "next/image";

const scenes = {
  games: "/app-illustrations/playroom-room-v1.webp",
  stories: "/app-illustrations/stories-reading-room-v1.webp",
  words: "/app-illustrations/communication-words-room-v1.webp",
  world: "/app-illustrations/communication-world-room-v1.webp",
};

export function LibraryScene({ scene }: { scene: keyof typeof scenes }) {
  return <figure className="library-mobile-scene" aria-hidden="true"><Image src={scenes[scene]} alt="" fill priority sizes="(max-width: 760px) 100vw, 1px"/></figure>;
}
