import { PARTIES, isValidParty } from './parties';

export const Validator = {
  voterLogin(voterId: string, password: string): string[] {
    if (voterId.trim() === '' || password === '') {
      return ['Invalid voter ID or password.'];
    }
    return [];
  },

  adminLogin(username: string, password: string): string[] {
    if (username.trim() === '' || password === '') {
      return ['Invalid admin username or password.'];
    }
    return [];
  },

  candidate(name: string, party: string): string[] {
    const errors: string[] = [];
    const trimmedName = name.trim();
    const trimmedParty = party.trim();

    if (trimmedName === '') {
      errors.push('Candidate name is required.');
    } else if (trimmedName.length < 2 || trimmedName.length > 120) {
      errors.push('Candidate name must be between 2 and 120 characters.');
    } else if (!/^[\p{L}\p{M}0-9\s.'-]+$/u.test(trimmedName)) {
      errors.push('Candidate name contains invalid characters.');
    }

    if (trimmedParty === '') {
      errors.push('Party is required.');
    } else if (!isValidParty(trimmedParty)) {
      errors.push(`Party must be one of: ${PARTIES.join(', ')}.`);
    }

    return errors;
  },

  vote(electorId: number | null | undefined, candidateId: number | null | undefined): string[] {
    const errors: string[] = [];

    if (electorId === null || electorId === undefined || isNaN(electorId) || electorId <= 0) {
      errors.push('A valid authenticated voter is required.');
    }

    if (candidateId === null || candidateId === undefined || isNaN(candidateId) || candidateId <= 0) {
      errors.push('A valid candidate must be selected.');
    }

    return errors;
  },
};
