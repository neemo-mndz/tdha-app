import { describe, it, expect } from 'vitest';
import { getInitials } from '../initials';

describe('getInitials', () => {
  describe('name with 2+ words', () => {
    it('returns first letter of first and last word', () => {
      expect(getInitials('João Silva', 'joao@email.com')).toBe('JS');
    });

    it('handles 3+ words by using first and last', () => {
      expect(getInitials('Maria Clara Santos', 'maria@email.com')).toBe('MS');
    });

    it('handles extra whitespace between words', () => {
      expect(getInitials('João   Silva', 'joao@email.com')).toBe('JS');
    });

    it('returns uppercase even with lowercase input', () => {
      expect(getInitials('ana costa', 'ana@email.com')).toBe('AC');
    });
  });

  describe('name with single word', () => {
    it('returns first letter of the name', () => {
      expect(getInitials('João', 'joao@email.com')).toBe('J');
    });

    it('returns uppercase for lowercase single word', () => {
      expect(getInitials('maria', 'maria@email.com')).toBe('M');
    });
  });

  describe('null or empty name — fallback to email', () => {
    it('uses email first letter when name is null', () => {
      expect(getInitials(null, 'joao@email.com')).toBe('J');
    });

    it('uses email first letter when name is empty string', () => {
      expect(getInitials('', 'maria@email.com')).toBe('M');
    });

    it('uses email first letter when name is whitespace-only', () => {
      expect(getInitials('   ', 'pedro@email.com')).toBe('P');
    });
  });
});
