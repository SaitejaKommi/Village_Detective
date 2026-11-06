// Mock-only content: canned in-character replies, clue text, timeline and secrets.
// This file is part of the MOCK. It is loaded lazily and never used with the real server.

export interface NpcScript {
  /** Claimed whereabouts around 10 PM. */
  alibi: string;
  /** Keyword (regex source) to reply. First match wins. */
  topics: [string, string][];
  generic: string[];
  /** Clue that damns this person if they are the killer. */
  damning: { title: string; text: string; room: string };
  /** Clue hinting at a (non-murder) secret. */
  herring: { title: string; text: string; room: string };
  secret: string;
  timelineLine: string;
}

export const SCRIPTS: Record<string, NpcScript> = {
  evelyn: {
    alibi: 'I was in the library with a book until the thunder started. Why would that matter, Detective?',
    topics: [
      ['alistair|husband|marriage', 'My husband and I understood one another. Do you believe that is a crime?'],
      ['lawyer|divorce', 'Who told you that? ...I see. Perhaps I should ask what you have been told.'],
      ['glove|study|safe', 'The study was his. I rarely went in. Do you think I enjoy being reminded of it?'],
    ],
    generic: [
      'You ask a great deal, Detective. Have you considered what you are really asking?',
      'I have told you what I know. What is it you think I am hiding?',
      'It has been a long night. Must we do this standing in the hall?',
    ],
    damning: { title: 'A damp black glove', text: 'A long black evening glove, still damp from the rain, lies by the study door. Evelyn said she never left the library.', room: 'study' },
    herring: { title: 'A solicitor\'s card', text: 'A business card from a divorce solicitor, tucked behind a book. It has an appointment written on the back.', room: 'library' },
    secret: 'She had secretly met a divorce lawyer that week.',
    timelineLine: 'Evelyn followed her husband to the study and argued with him.',
  },
  julian: {
    alibi: 'Out in the greenhouse, smoking. Dad hates the smell, so I do it where he can\'t see. Could\'ve been seen, sure, if anyone looked.',
    topics: [
      ['money|debt|gambl', 'Oh, so we\'re doing the debts. Fine. I owe people money. Everyone does. Doesn\'t make me a murderer.'],
      ['father|dad|alistair', 'Dad and I had... a complicated relationship. Mostly he complicated, I disappointed.'],
      ['heirloom|watch|sold', 'Sold? Who says I sold anything? ...Okay. Maybe one small thing.'],
    ],
    generic: [
      'Look, I\'m flattered you think I\'m interesting enough to kill someone.',
      'Ask someone else. Ask Margaret. She likes me, she\'ll lie better than I will.',
      'You want a confession? I can give you a joke instead.',
    ],
    damning: { title: 'Muddy footprints', text: 'Fresh, muddy footprints cross the hall from the garden door to the study. A man\'s size, a worn heel. Julian claimed he never came inside.', room: 'garden' },
    herring: { title: 'A pawn ticket', text: 'A pawn shop ticket for a family heirloom, dated last week, in the pocket of a discarded blazer.', room: 'dining' },
    secret: 'Gambling debts. He had sold a family heirloom to cover them.',
    timelineLine: 'Julian came in from the garden and confronted his father about the allowance.',
  },
  harold: {
    alibi: 'I was in the dining room clearing the service, sir. I remained there until I heard the household stir.',
    topics: [
      ['safe|study|open', 'Mr. Blackwood\'s affairs were his own, sir. I am not at liberty to discuss them.'],
      ['evelyn|madam', 'Madam has always been most gracious. I would not presume to say more.'],
      ['key|lock', 'The keys are Mrs. Doyle\'s concern, sir. I have my own duties.'],
    ],
    generic: [
      'I could not say, sir.',
      'It would not be proper for me to speculate.',
      'I have served this family for thirty years. I do not intend to start gossiping now.',
    ],
    damning: { title: 'White glove, powdered', text: 'A white glove dusted with the same grey powder as the study safe. Harold insisted he never touched it that night.', room: 'study' },
    herring: { title: 'Open safe ledger', text: 'A page from the study safe\'s ledger, signed in a careful hand. Someone opened it after dinner, at Mr. Blackwood\'s request.', room: 'study' },
    secret: 'He opened the study safe for Alistair that night and knows what was inside.',
    timelineLine: 'Harold opened the safe for Alistair, then lingered in the study corridor.',
  },
  margaret: {
    alibi: 'I was in the kitchen setting tomorrow\'s bread. I heard raised voices a while back, but I keep to my work.',
    topics: [
      ['argu|voices|heard', 'I heard raised voices upstairs. I won\'t say whose. It\'s not my place, and I need this position.'],
      ['julian', 'Master Julian is a good boy at heart. Do not be hard on him.'],
      ['victor|crane', 'Mr. Crane smiles a lot. In my experience, that is not always a good sign.'],
      ['key|keys', 'The keys never leave my belt. Except when I set them down to wash my hands, of course.'],
    ],
    generic: [
      'I notice things, sir. I just don\'t always say.',
      'I have work waiting. Ask your questions plainly.',
      'The family\'s business is the family\'s business.',
    ],
    damning: { title: 'Missing study key', text: 'The ring of keys is short one: the study key. Margaret claimed her keys never left her belt.', room: 'kitchen' },
    herring: { title: 'A scribbled note', text: 'A note in a shaky hand: \'I heard them quarrelling. I am frightened to say.\' It is unsigned.', room: 'kitchen' },
    secret: 'She overheard an argument that night and is afraid to say so.',
    timelineLine: 'Margaret took the study key from her ring and went to confront Alistair about her dismissal.',
  },
  victor: {
    alibi: 'On the telephone in the foyer, dear fellow, with the office in London. Surely the operator would remember.',
    topics: [
      ['money|company|fraud|books|accounts', 'Business is a delicate matter, Detective. Surely you would not want to ruin a good evening with accounts.'],
      ['alistair|partner|rival', 'Alistair and I were rivals, yes. The best sort of friends are.'],
      ['evelyn', 'Evelyn and I knew one another long before Alistair. A gentleman does not say more.'],
    ],
    generic: [
      'Let us not be hasty. Let us discuss it like gentlemen.',
      'You are clever, Detective. Clever men understand when to look elsewhere.',
      'Whatever you have heard, I can explain it over a drink.',
    ],
    damning: { title: 'Torn telephone cord', text: 'The foyer telephone cord was cut, not pulled: no call could have been made after nine. Victor said he was on the line with London.', room: 'foyer' },
    herring: { title: 'Doctored ledger page', text: 'A page from the company ledger with numbers changed in a different ink, hidden in the library.', room: 'library' },
    secret: 'He had been moving money out of the company.',
    timelineLine: 'Victor slipped away from the foyer and met Alistair in the study to settle the accounts.',
  },
};

export const NEUTRAL_CLUES = [
  { id: 'c_body', title: 'Alistair Blackwood', text: 'The master of the house lies where he fell, one hand outstretched. The study clock stopped at twenty past ten.', room: 'study', label: 'Body' },
  { id: 'c_will', title: 'A torn will', text: 'A draft of a new will, torn in half. Alistair meant to change it that week. Someone did not want him to.', room: 'library', label: 'Torn paper' },
];

export const TRUE_TIMELINE_HEAD = [
  '9:00 PM: Dinner ends. The household scatters to different rooms.',
  '9:40 PM: Alistair retires to the study, telling Harold to open the safe.',
];
export const TRUE_TIMELINE_TAIL = [
  '10:20 PM: Alistair Blackwood is killed in the study.',
  '10:45 PM: The body is discovered. The household is gathered in the foyer.',
];
