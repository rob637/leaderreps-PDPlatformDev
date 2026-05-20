import { describe, it, expect, vi } from 'vitest';
import {
  validateProspect,
  getValidationSummary,
  findDuplicateClusters,
  mergeProspects,
} from './dataQuality';

describe('validateProspect', () => {
  it('flags missing name as error', () => {
    const { ok, issues } = validateProspect({ email: 'a@b.com' });
    expect(ok).toBe(false);
    expect(issues.some((i) => i.field === 'firstName' && i.level === 'error')).toBe(true);
  });

  it('flags invalid email format', () => {
    const { issues } = validateProspect({ firstName: 'Jane', email: 'not-an-email' });
    expect(issues.some((i) => i.field === 'email' && i.level === 'error')).toBe(true);
  });

  it('warns on missing email', () => {
    const { issues } = validateProspect({ firstName: 'Jane' });
    expect(issues.some((i) => i.field === 'email' && i.level === 'warn')).toBe(true);
  });

  it('passes for a complete prospect', () => {
    const { ok, issues } = validateProspect({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+1 555 123 4567',
      title: 'VP',
      company: 'Acme',
      ownerEmail: 'rob@sagecg.com',
      linkedinUrl: 'https://linkedin.com/in/janedoe',
    });
    expect(ok).toBe(true);
    expect(issues.length).toBe(0);
  });

  it('warns on suspicious LinkedIn URL', () => {
    const { issues } = validateProspect({
      firstName: 'Jane',
      email: 'a@b.com',
      ownerEmail: 'x@y.com',
      company: 'A',
      title: 'B',
      linkedinUrl: 'http://example.com/notlinkedin',
    });
    expect(issues.some((i) => i.field === 'linkedinUrl')).toBe(true);
  });
});

describe('getValidationSummary', () => {
  it('aggregates error and warn counts', () => {
    const summary = getValidationSummary([
      { firstName: '', email: 'bad' },
      { firstName: 'Jane' },
    ]);
    expect(summary.errorCount).toBeGreaterThan(0);
    expect(summary.warnCount).toBeGreaterThan(0);
  });
});

describe('findDuplicateClusters', () => {
  it('finds clusters by exact email', () => {
    const clusters = findDuplicateClusters([
      { id: '1', firstName: 'Jane', email: 'jane@acme.com' },
      { id: '2', firstName: 'J', email: 'JANE@acme.com' },
      { id: '3', firstName: 'Bob', email: 'bob@acme.com' },
    ]);
    expect(clusters.length).toBe(1);
    expect(clusters[0].reason).toBe('Same email');
    expect(clusters[0].prospects.map((p) => p.id).sort()).toEqual(['1', '2']);
  });

  it('finds clusters by name + email domain', () => {
    const clusters = findDuplicateClusters([
      { id: '1', firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@acme.com' },
      { id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jdoe@acme.com' },
    ]);
    expect(clusters.length).toBe(1);
    expect(clusters[0].reason).toBe('Same name + email domain');
  });

  it('returns no clusters for clean data', () => {
    const clusters = findDuplicateClusters([
      { id: '1', firstName: 'A', email: 'a@x.com' },
      { id: '2', firstName: 'B', email: 'b@y.com' },
    ]);
    expect(clusters.length).toBe(0);
  });
});

describe('mergeProspects', () => {
  it('copies missing fields from others into survivor and deletes others', async () => {
    const survivor = { id: 's', firstName: 'Jane', email: '' };
    const others = [
      { id: 'o1', firstName: 'Jane', email: 'jane@acme.com', title: 'VP' },
      { id: 'o2', firstName: 'Jane', company: 'Acme' },
    ];
    const updateProspect = vi.fn(async () => {});
    const deleteProspect = vi.fn(async () => {});

    await mergeProspects(survivor, others, { updateProspect, deleteProspect });

    expect(updateProspect).toHaveBeenCalledTimes(1);
    const [survId, updates] = updateProspect.mock.calls[0];
    expect(survId).toBe('s');
    expect(updates.email).toBe('jane@acme.com');
    expect(updates.title).toBe('VP');
    expect(updates.company).toBe('Acme');

    expect(deleteProspect).toHaveBeenCalledTimes(2);
    expect(deleteProspect.mock.calls.map((c) => c[0]).sort()).toEqual(['o1', 'o2']);
  });

  it('does not overwrite existing fields on the survivor', async () => {
    const survivor = { id: 's', firstName: 'Jane', email: 'survivor@acme.com', title: 'CEO' };
    const others = [{ id: 'o1', email: 'other@acme.com', title: 'VP' }];
    const updateProspect = vi.fn(async () => {});
    const deleteProspect = vi.fn(async () => {});

    await mergeProspects(survivor, others, { updateProspect, deleteProspect });

    if (updateProspect.mock.calls.length > 0) {
      const updates = updateProspect.mock.calls[0][1];
      expect(updates.email).toBeUndefined();
      expect(updates.title).toBeUndefined();
    }
  });
});
