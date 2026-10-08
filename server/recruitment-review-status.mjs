// Shared UI/business vocabulary only; no intake validator or server config import.
export const STATUSES = Object.freeze({
  new: 'Baru',
  reviewing: 'Ditinjau',
  shortlisted: 'Shortlist',
  interview: 'Wawancara',
  waitlisted: 'Daftar tunggu',
  accepted: 'Diterima',
  rejected: 'Ditolak',
  withdrawn: 'Mengundurkan diri',
});
export const TRANSITIONS = Object.freeze({
  new: ['reviewing', 'rejected', 'withdrawn'],
  reviewing: ['shortlisted', 'waitlisted', 'rejected', 'withdrawn'],
  shortlisted: ['interview', 'accepted', 'waitlisted', 'rejected', 'withdrawn'],
  interview: ['accepted', 'waitlisted', 'rejected', 'withdrawn'],
  waitlisted: [
    'reviewing',
    'shortlisted',
    'interview',
    'accepted',
    'rejected',
    'withdrawn',
  ],
  accepted: ['reviewing'],
  rejected: ['reviewing'],
  withdrawn: ['reviewing'],
});
export const TERMINAL = ['accepted', 'rejected', 'withdrawn'];
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
