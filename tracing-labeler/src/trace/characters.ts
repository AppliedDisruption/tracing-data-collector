export type CharacterEntry = {
  character: string;
  svgPath: string;
  viewBox: string;
};

const VB = '0 0 260 300';

export type TraceMode = 'capital' | 'small' | 'digit';

export const CAPITAL_CHARACTERS: CharacterEntry[] = [
  { character: 'A', svgPath: 'M60 272 L130 28 L200 272 M85 188 L175 188', viewBox: VB },
  {
    character: 'B',
    svgPath:
      'M43 25 L43 275 L155 275 Q218 275 218 213 Q218 150 155 150 L43 150 M43 150 L143 150 Q205 150 205 88 Q205 25 143 25 L43 25',
    viewBox: VB,
  },
  { character: 'C', svgPath: 'M210 62 C178 34 130 24 90 40 C50 56 32 98 32 150 C32 202 50 244 90 260 C130 276 178 266 210 238', viewBox: VB },
  { character: 'D', svgPath: 'M60 28 L60 272 M60 28 L140 28 Q220 28 220 150 Q220 272 140 272 L60 272', viewBox: VB },
  { character: 'E', svgPath: 'M60 28 L60 272 M60 28 L210 28 M60 150 L180 150 M60 272 L210 272', viewBox: VB },
  { character: 'F', svgPath: 'M60 28 L60 272 M60 28 L210 28 M60 150 L180 150', viewBox: VB },
  { character: 'G', svgPath: 'M210 66 C178 36 130 26 90 42 C52 58 34 100 34 150 C34 200 52 242 90 258 C130 274 178 264 210 234 M210 170 L150 170', viewBox: VB },
  { character: 'H', svgPath: 'M60 28 L60 272 M200 28 L200 272 M60 150 L200 150', viewBox: VB },
  { character: 'I', svgPath: 'M60 28 L200 28 M130 28 L130 272 M60 272 L200 272', viewBox: VB },
  { character: 'J', svgPath: 'M60 28 L210 28 M140 28 L140 220 Q140 272 90 272 Q40 272 40 224', viewBox: VB },
  { character: 'K', svgPath: 'M60 28 L60 272 M200 28 L60 165 M200 272 L60 165', viewBox: VB },
  { character: 'L', svgPath: 'M60 28 L60 272 M60 272 L210 272', viewBox: VB },
  { character: 'M', svgPath: 'M50 272 L50 28 L130 170 L210 28 L210 272', viewBox: VB },
  { character: 'N', svgPath: 'M60 272 L60 28 L200 272 L200 28', viewBox: VB },
  { character: 'O', svgPath: 'M130 28 C62 28 32 84 32 150 C32 216 62 272 130 272 C198 272 228 216 228 150 C228 84 198 28 130 28 Z', viewBox: VB },
  { character: 'P', svgPath: 'M60 272 L60 28 L150 28 Q215 28 215 90 Q215 150 150 150 L60 150', viewBox: VB },
  { character: 'Q', svgPath: 'M130 28 C62 28 32 84 32 150 C32 216 62 272 130 272 C198 272 228 216 228 150 C228 84 198 28 130 28 Z M165 210 L220 272', viewBox: VB },
  { character: 'R', svgPath: 'M60 272 L60 28 L150 28 Q215 28 215 90 Q215 150 150 150 L60 150 M150 150 L215 272', viewBox: VB },
  { character: 'S', svgPath: 'M206 64 C172 34 108 30 74 58 C46 82 48 122 82 138 C110 152 152 150 176 164 C202 180 198 218 170 240 C136 268 76 266 44 236', viewBox: VB },
  { character: 'T', svgPath: 'M40 28 L220 28 M130 28 L130 272', viewBox: VB },
  { character: 'U', svgPath: 'M60 28 L60 190 Q60 272 130 272 Q200 272 200 190 L200 28', viewBox: VB },
  { character: 'V', svgPath: 'M50 28 L130 272 L210 28', viewBox: VB },
  { character: 'W', svgPath: 'M40 28 L85 272 L130 110 L175 272 L220 28', viewBox: VB },
  { character: 'X', svgPath: 'M50 28 L210 272 M210 28 L50 272', viewBox: VB },
  { character: 'Y', svgPath: 'M50 28 L130 150 L210 28 M130 150 L130 272', viewBox: VB },
  { character: 'Z', svgPath: 'M50 28 L210 28 L50 272 L210 272', viewBox: VB },
];

export const SMALL_CHARACTERS: CharacterEntry[] = [
  { character: 'a', svgPath: 'M182 246 L182 146 C182 108 156 84 124 84 C84 84 56 116 56 160 C56 206 86 242 126 242 C154 242 174 224 182 196', viewBox: VB },
  { character: 'b', svgPath: 'M68 46 L68 252 M68 176 C80 122 110 86 150 86 C194 86 222 124 222 170 C222 214 194 252 150 252 C110 252 80 224 68 176', viewBox: VB },
  { character: 'c', svgPath: 'M210 112 C190 82 162 66 126 66 C82 66 52 104 52 158 C52 212 82 252 126 252 C162 252 190 236 210 206', viewBox: VB },
  { character: 'd', svgPath: 'M192 46 L192 252 M192 176 C180 122 150 86 110 86 C66 86 38 124 38 170 C38 214 66 252 110 252 C150 252 180 224 192 176', viewBox: VB },
  { character: 'e', svgPath: 'M204 160 C204 114 174 84 130 84 C88 84 58 116 58 160 C58 204 88 242 130 242 C160 242 184 230 200 210 M74 154 L188 154', viewBox: VB },
  { character: 'f', svgPath: 'M154 54 C142 42 122 44 110 58 C98 72 96 94 96 118 L96 252 M58 128 L146 128', viewBox: VB },
  { character: 'g', svgPath: 'M184 230 L184 146 C184 108 158 84 126 84 C86 84 58 116 58 160 C58 202 86 234 126 234 C154 234 174 218 184 194 M184 230 C184 262 162 278 132 278 C108 278 90 268 80 252', viewBox: VB },
  { character: 'h', svgPath: 'M66 46 L66 252 M66 176 C78 122 106 86 144 86 C186 86 212 116 212 162 L212 252', viewBox: VB },
  { character: 'i', svgPath: 'M130 86 L130 252 M130 56 L130 62', viewBox: VB },
  { character: 'j', svgPath: 'M140 86 L140 258 C140 272 130 280 116 280 C104 280 94 274 86 264 M140 56 L140 62', viewBox: VB },
  { character: 'k', svgPath: 'M70 46 L70 252 M212 86 L70 170 M124 150 L214 252', viewBox: VB },
  { character: 'l', svgPath: 'M130 46 L130 252', viewBox: VB },
  { character: 'm', svgPath: 'M24 252 L24 86 M24 176 C34 122 54 86 82 86 C112 86 130 112 130 148 L130 252 M130 176 C140 122 160 86 188 86 C218 86 236 112 236 148 L236 252', viewBox: VB },
  { character: 'n', svgPath: 'M58 252 L58 86 M58 176 C70 122 96 86 136 86 C178 86 206 116 206 162 L206 252', viewBox: VB },
  { character: 'o', svgPath: 'M130 66 C82 66 50 104 50 160 C50 214 82 252 130 252 C178 252 210 214 210 160 C210 104 178 66 130 66 Z', viewBox: VB },
  { character: 'p', svgPath: 'M68 86 L68 278 M68 176 C80 122 110 86 150 86 C194 86 222 124 222 170 C222 214 194 252 150 252 C110 252 80 224 68 176', viewBox: VB },
  { character: 'q', svgPath: 'M192 86 L192 278 M192 176 C180 122 150 86 110 86 C66 86 38 124 38 170 C38 214 66 252 110 252 C150 252 180 224 192 176', viewBox: VB },
  { character: 'r', svgPath: 'M88 252 L88 86 M88 176 C98 126 122 92 154 92 C168 92 180 96 192 106', viewBox: VB },
  { character: 's', svgPath: 'M194 112 C174 88 136 80 106 92 C84 102 80 122 96 136 C116 152 158 148 180 164 C200 180 196 212 172 228 C146 244 104 244 80 226', viewBox: VB },
  { character: 't', svgPath: 'M124 54 L124 218 C124 244 140 252 162 252 C172 252 182 248 190 242 M82 122 L166 122', viewBox: VB },
  { character: 'u', svgPath: 'M58 86 L58 180 C58 224 86 252 126 252 C160 252 188 226 202 194 M202 86 L202 252', viewBox: VB },
  { character: 'v', svgPath: 'M50 86 L130 252 L210 86', viewBox: VB },
  { character: 'w', svgPath: 'M34 86 L78 252 L130 138 L182 252 L226 86', viewBox: VB },
  { character: 'x', svgPath: 'M54 86 L206 252 M206 86 L54 252', viewBox: VB },
  { character: 'y', svgPath: 'M52 86 L130 224 M208 86 L130 224 L108 278', viewBox: VB },
  { character: 'z', svgPath: 'M56 86 L204 86 L56 252 L204 252', viewBox: VB },
];

export const DIGIT_CHARACTERS: CharacterEntry[] = [
  { character: '0', svgPath: 'M130 36 C82 36 52 86 52 156 C52 226 82 276 130 276 C178 276 208 226 208 156 C208 86 178 36 130 36 Z', viewBox: VB },
  { character: '1', svgPath: 'M146 36 L146 276 M118 64 L146 36 M102 276 L182 276', viewBox: VB },
  { character: '2', svgPath: 'M78 94 C92 62 118 46 146 46 C180 46 202 66 202 94 C202 118 188 138 164 158 L96 230 L210 230', viewBox: VB },
  { character: '3', svgPath: 'M70 74 C92 50 122 36 154 36 C194 36 218 58 218 90 C218 120 196 138 168 148 C200 158 222 178 222 210 C222 248 194 276 146 276 C112 276 84 264 64 244', viewBox: VB },
  { character: '4', svgPath: 'M178 36 L178 276 M56 184 L220 184 M56 184 L168 36', viewBox: VB },
  { character: '5', svgPath: 'M210 36 L92 36 L80 146 C96 136 114 132 136 132 C186 132 220 162 220 208 C220 248 188 276 144 276 C108 276 80 264 60 244', viewBox: VB },
  { character: '6', svgPath: 'M62 186 C62 226 90 256 130 256 C170 256 198 226 198 186 C198 146 170 116 130 116 C90 116 62 146 62 186 Z M62 186 L62 104 C62 66 88 40 128 40 C152 40 172 50 188 66', viewBox: VB },
  { character: '7', svgPath: 'M56 36 L220 36 L108 276', viewBox: VB },
  { character: '8', svgPath: 'M130 36 C92 36 68 58 68 92 C68 126 92 148 130 148 C168 148 192 126 192 92 C192 58 168 36 130 36 Z M130 148 C84 148 56 176 56 214 C56 252 84 276 130 276 C176 276 204 252 204 214 C204 176 176 148 130 148 Z', viewBox: VB },
  { character: '9', svgPath: 'M130 36 C86 36 56 66 56 108 C56 150 86 180 130 180 C174 180 204 150 204 108 C204 66 174 36 130 36 Z M204 108 L204 208 C204 250 174 276 130 276 C102 276 80 266 62 248', viewBox: VB },
];

export const CHARACTERS: CharacterEntry[] = CAPITAL_CHARACTERS;

export function getCharactersForMode(mode: TraceMode): CharacterEntry[] {
  switch (mode) {
    case 'small':
      return SMALL_CHARACTERS;
    case 'digit':
      return DIGIT_CHARACTERS;
    case 'capital':
    default:
      return CAPITAL_CHARACTERS;
  }
}

export function getShuffledCharacters(mode: TraceMode): CharacterEntry[] {
  const copy = [...getCharactersForMode(mode)];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i]!;
    const b = copy[j]!;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}
