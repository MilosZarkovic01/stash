import { AiService } from './ai.service';
import { EXPENSE_CLASSIFIER } from './classifier';

describe('AiService', () => {
  const prisma = {
    category: {
      findMany: jest.fn().mockResolvedValue([
        { id: '1', slug: 'taxi', name: 'Taxi' },
        { id: '2', slug: 'other', name: 'Other' },
      ]),
    },
  };

  it('falls back to other/0 when the classifier throws', async () => {
    const classifier = {
      classify: jest.fn().mockRejectedValue(new Error('down')),
    };
    const service = new AiService(classifier, prisma as never);
    await expect(service.classify('u1', 'taxi do grada')).resolves.toEqual({
      category: 'other',
      confidence: 0,
    });
  });

  it('uses NL heuristics when classifier confidence is low', async () => {
    const classifier = {
      classify: jest
        .fn()
        .mockResolvedValue({ category: 'other', confidence: 0.1 }),
    };
    const service = new AiService(classifier, prisma as never);
    const parsed = await service.parse('u1', '1200 taxi do grada');
    expect(parsed.amount).toBe('1200');
    expect(parsed.category).toBe('taxi');
    expect(parsed.confidence).toBeLessThan(0.6);
  });

  it('keeps the injected token name stable', () => {
    expect(EXPENSE_CLASSIFIER).toBe('EXPENSE_CLASSIFIER');
  });
});
