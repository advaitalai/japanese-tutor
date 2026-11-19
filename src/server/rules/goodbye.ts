// Goodbye detection lives in code: the prototype's model sometimes missed またね.
// Japanese goodbyes must end the message, so お休みの日 ("a day off") is not a goodbye.
const END = String.raw`[\s。．.!！~〜ー…]*$`;
const JAPANESE = new RegExp(
  String.raw`(またね|また明日|またあした|じゃあね|じゃね|では、?また|バイバイ|ばいばい|さようなら|さよなら|おやすみ(なさい)?|お休み(なさい)?)` + END,
);
const ENGLISH = /\b(bye|goodbye|good night|see you|see ya|gotta go|i have to go|i need to go|talk (to you )?later)\b/i;
const ROMAJI = /\b(mata ne|jaa ne|ja ne|sayonara|oyasumi( nasai)?)\b/i;

export function isGoodbye(text: string): boolean {
  const t = text.normalize("NFKC").trim();
  return JAPANESE.test(t) || ENGLISH.test(t) || ROMAJI.test(t);
}
