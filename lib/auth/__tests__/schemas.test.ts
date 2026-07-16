import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loginSchema, registerSchema } from '../schemas';

// --- Generators ---

// Valid email: local@domain.tld
const validEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/),
    fc.stringMatching(/^[a-z0-9]([a-z0-9-]{0,20}[a-z0-9])?$/),
    fc.stringMatching(/^[a-z]{2,6}$/)
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)
  .filter((e) => e.length <= 254 && e.length >= 5);

// Invalid email: missing @, missing domain, etc.
const invalidEmailArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@')),
  fc.string({ minLength: 1, maxLength: 50 }).map((s) => `@${s}`),
  fc.string({ minLength: 1, maxLength: 50 }).map((s) => `${s}@`),
  fc.constant('user@@domain.com'),
  fc.constant('user@.com'),
  fc.constant('@domain.com'),
  fc.constant('user@domain..com')
);

// Valid password for register: 8-128 chars
const validPasswordArb = fc.string({ minLength: 8, maxLength: 128 }).filter((s) => s.length >= 8);

// Short password (< 8 chars)
const shortPasswordArb = fc.string({ minLength: 1, maxLength: 7 });

// Long password (> 128 chars)
const longPasswordArb = fc.string({ minLength: 129, maxLength: 200 });

// --- loginSchema tests ---

describe('loginSchema', () => {
  it('accepts valid email and non-empty password', () => {
    fc.assert(
      fc.property(
        validEmailArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        (email, password) => {
          const result = loginSchema.safeParse({ email, password });
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'anything' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('email'));
      expect(emailError?.message).toBe('Campo obrigatório');
    }
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path.includes('password'));
      expect(pwError?.message).toBe('Campo obrigatório');
    }
  });

  it('rejects invalid email formats', () => {
    fc.assert(
      fc.property(invalidEmailArb, (email) => {
        const result = loginSchema.safeParse({ email, password: 'somepassword' });
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('normalizes email to lowercase and trimmed', () => {
    const result = loginSchema.safeParse({
      email: '  User@Example.COM  ',
      password: 'password',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects email exceeding 254 characters', () => {
    const longEmail = 'a'.repeat(246) + '@test.com'; // 255 chars
    const result = loginSchema.safeParse({ email: longEmail, password: 'password' });
    expect(result.success).toBe(false);
  });
});

// --- registerSchema tests ---

describe('registerSchema', () => {
  it('accepts valid email, password (8-128 chars), and matching confirmPassword', () => {
    fc.assert(
      fc.property(validEmailArb, validPasswordArb, (email, password) => {
        const result = registerSchema.safeParse({
          email,
          password,
          confirmPassword: password,
        });
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it('rejects password shorter than 8 characters', () => {
    fc.assert(
      fc.property(validEmailArb, shortPasswordArb, (email, password) => {
        const result = registerSchema.safeParse({
          email,
          password,
          confirmPassword: password,
        });
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rejects password longer than 128 characters', () => {
    fc.assert(
      fc.property(validEmailArb, longPasswordArb, (email, password) => {
        const result = registerSchema.safeParse({
          email,
          password,
          confirmPassword: password,
        });
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('rejects mismatched confirmPassword', () => {
    fc.assert(
      fc.property(
        validEmailArb,
        validPasswordArb,
        validPasswordArb.filter((p) => p.length >= 8),
        (email, password, otherPassword) => {
          fc.pre(password !== otherPassword);
          const result = registerSchema.safeParse({
            email,
            password,
            confirmPassword: otherPassword,
          });
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('shows correct error message for short password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '1234567',
      confirmPassword: '1234567',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path.includes('password'));
      expect(pwError?.message).toBe('A senha precisa ter entre 8 e 128 caracteres');
    }
  });

  it('shows correct error message for long password', () => {
    const longPw = 'a'.repeat(129);
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: longPw,
      confirmPassword: longPw,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path.includes('password'));
      expect(pwError?.message).toBe('A senha precisa ter entre 8 e 128 caracteres');
    }
  });

  it('shows correct error message for password mismatch', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'validpassword',
      confirmPassword: 'differentpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((i) =>
        i.path.includes('confirmPassword')
      );
      expect(confirmError?.message).toBe('As senhas não coincidem');
    }
  });

  it('normalizes email to lowercase and trimmed', () => {
    const result = registerSchema.safeParse({
      email: '  Test@EMAIL.com  ',
      password: 'validpassword',
      confirmPassword: 'validpassword',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@email.com');
    }
  });

  it('accepts password with no complexity requirements (only lowercase)', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    });
    expect(result.success).toBe(true);
  });

  it('accepts password with only numbers', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('accepts password with special chars only', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '!@#$%^&*',
      confirmPassword: '!@#$%^&*',
    });
    expect(result.success).toBe(true);
  });

  it('accepts exactly 8 char password (lower bound)', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('accepts exactly 128 char password (upper bound)', () => {
    const pw = 'x'.repeat(128);
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: pw,
      confirmPassword: pw,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty email with "Campo obrigatório"', () => {
    const result = registerSchema.safeParse({
      email: '',
      password: 'validpassword',
      confirmPassword: 'validpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('email'));
      expect(emailError?.message).toBe('Campo obrigatório');
    }
  });

  it('all error messages are at most 80 characters', () => {
    const testCases = [
      { email: '', password: '', confirmPassword: '' },
      { email: 'bad', password: '123', confirmPassword: '456' },
      { email: 'user@example.com', password: 'short', confirmPassword: 'short' },
      { email: 'user@example.com', password: 'validpass', confirmPassword: 'other' },
    ];

    for (const input of testCases) {
      const result = registerSchema.safeParse(input);
      if (!result.success) {
        for (const issue of result.error.issues) {
          expect(issue.message.length).toBeLessThanOrEqual(80);
        }
      }
    }
  });
});
