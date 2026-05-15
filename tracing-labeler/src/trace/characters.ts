export type CharacterEntry = {
  character: string;
  svgPath: string;
  viewBox: string;
};

const VB = '0 0 260 300';

export const CHARACTERS: CharacterEntry[] = [
  {
    character: 'A',
    svgPath:
      'M130 28 L48 272 L102 272 L128 168 L152 272 L206 272 L130 28 M112 198 L168 198',
    viewBox: VB,
  },
  {
    character: 'B',
    svgPath:
      'M43 25 L43 275 L155 275 Q218 275 218 213 Q218 150 155 150 L43 150 M43 150 L143 150 Q205 150 205 88 Q205 25 143 25 L43 25',
    viewBox: VB,
  },
  {
    character: 'C',
    svgPath:
      'M205 58 C88 22 38 118 38 150 C38 218 92 282 205 242',
    viewBox: VB,
  },
  {
    character: 'D',
    svgPath:
      'M52 32 L52 268 L132 268 C208 268 228 168 228 150 C228 72 208 32 132 32 L52 32',
    viewBox: VB,
  },
];

export function getShuffledCharacters(): CharacterEntry[] {
  const copy = [...CHARACTERS];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i]!;
    const b = copy[j]!;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}
