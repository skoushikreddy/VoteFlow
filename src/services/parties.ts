export const PARTIES = [
  'TDP',
  'YSRCP',
  'JSP',
  'BJP',
  'CONGRESS',
  'NOTA',
] as const;

export type PartyType = (typeof PARTIES)[number];

export interface PartyMeta {
  code: PartyType;
  fullName: string;
  color: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  symbol: string;
}

export const PARTY_METADATA: Record<PartyType, PartyMeta> = {
  TDP: {
    code: 'TDP',
    fullName: 'Telugu Desam Party',
    color: '#ca8a04',
    borderClass: 'border-yellow-400',
    badgeBg: '#fef9c3',
    badgeText: '#854d0e',
    symbol: 'Bicycle',
  },
  YSRCP: {
    code: 'YSRCP',
    fullName: 'Yuvajana Sramika Rythu Congress Party',
    color: '#059669',
    borderClass: 'border-emerald-500',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
    symbol: 'Ceiling Fan',
  },
  JSP: {
    code: 'JSP',
    fullName: 'Jana Sena Party',
    color: '#dc2626',
    borderClass: 'border-rose-500',
    badgeBg: '#ffe4e6',
    badgeText: '#9f1239',
    symbol: 'Glass Tumbler',
  },
  BJP: {
    code: 'BJP',
    fullName: 'Bharatiya Janata Party',
    color: '#ea580c',
    borderClass: 'border-orange-500',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412',
    symbol: 'Lotus',
  },
  CONGRESS: {
    code: 'CONGRESS',
    fullName: 'Indian National Congress',
    color: '#0284c7',
    borderClass: 'border-sky-500',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
    symbol: 'Hand',
  },
  NOTA: {
    code: 'NOTA',
    fullName: 'None of the Above',
    color: '#475569',
    borderClass: 'border-slate-400',
    badgeBg: '#f1f5f9',
    badgeText: '#334155',
    symbol: 'Ballot Stamp',
  },
};

export function isValidParty(party: string): boolean {
  return PARTIES.includes(party as PartyType);
}

export function getPartyMeta(party: string): PartyMeta {
  if (party in PARTY_METADATA) {
    return PARTY_METADATA[party as PartyType];
  }
  return {
    code: 'NOTA',
    fullName: party || 'Independent',
    color: '#475569',
    borderClass: 'border-slate-300',
    badgeBg: '#f1f5f9',
    badgeText: '#334155',
    symbol: 'Independent',
  };
}
