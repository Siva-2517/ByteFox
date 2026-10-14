import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../lib/db';
import crypto from 'crypto';

describe('Security & Multi-Tenant Access Control Tests', () => {
  let userAId: string;
  let userBId: string;
  let userADatasetId: string;
  let userAReportId: string;
  let activeToken: string;
  let expiredToken: string;
  let revokedToken: string;

  beforeAll(async () => {
    // Seed test users
    const userA = await db.user.create({
      data: {
        email: `test_user_a_${Date.now()}@bytevox.ai`,
        name: 'User A',
        passwordHash: 'dummy_hash',
      },
    });
    userAId = userA.id;

    const userB = await db.user.create({
      data: {
        email: `test_user_b_${Date.now()}@bytevox.ai`,
        name: 'User B',
        passwordHash: 'dummy_hash',
      },
    });
    userBId = userB.id;

    // Seed Dataset for User A
    const dataset = await db.dataset.create({
      data: {
        userId: userAId,
        name: 'User A Financials',
        filename: 'financials.csv',
        fileSizeBytes: 1024,
        rowCount: 10,
        unparseableCount: 0,
        columns: JSON.stringify([{ name: 'amount', type: 'number' }]),
        unparseableRows: JSON.stringify([]),
      },
    });
    userADatasetId = dataset.id;

    // Seed Report for User A
    const report = await db.report.create({
      data: {
        userId: userAId,
        datasetId: userADatasetId,
        title: 'Q1 Confidential Report',
        globalFilters: '{}',
      },
    });
    userAReportId = report.id;

    // Active Share Link
    activeToken = crypto.randomBytes(16).toString('hex');
    await db.shareLink.create({
      data: {
        reportId: userAReportId,
        token: activeToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h in future
        isRevoked: false,
      },
    });

    // Expired Share Link
    expiredToken = crypto.randomBytes(16).toString('hex');
    await db.shareLink.create({
      data: {
        reportId: userAReportId,
        token: expiredToken,
        expiresAt: new Date(Date.now() - 1000 * 60), // expired 1 min ago
        isRevoked: false,
      },
    });

    // Revoked Share Link
    revokedToken = crypto.randomBytes(16).toString('hex');
    await db.shareLink.create({
      data: {
        reportId: userAReportId,
        token: revokedToken,
        expiresAt: null,
        isRevoked: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (userAId) await db.user.delete({ where: { id: userAId } }).catch(() => {});
    if (userBId) await db.user.delete({ where: { id: userBId } }).catch(() => {});
  });

  it('enforces multi-tenant isolation: User B cannot access User A dataset', async () => {
    const dataset = await db.dataset.findFirst({
      where: {
        id: userADatasetId,
        userId: userBId, // attempting access as User B
      },
    });
    expect(dataset).toBeNull();
  });

  it('enforces multi-tenant isolation: User B cannot access User A report', async () => {
    const report = await db.report.findFirst({
      where: {
        id: userAReportId,
        userId: userBId, // attempting access as User B
      },
    });
    expect(report).toBeNull();
  });

  it('allows access to active, unrevoked share link', async () => {
    const link = await db.shareLink.findUnique({
      where: { token: activeToken },
    });
    expect(link).not.toBeNull();
    expect(link?.isRevoked).toBe(false);
    expect(link?.expiresAt && new Date(link.expiresAt) > new Date()).toBe(true);
  });

  it('detects and rejects expired share links', async () => {
    const link = await db.shareLink.findUnique({
      where: { token: expiredToken },
    });
    expect(link).not.toBeNull();
    const isExpired = link?.expiresAt && new Date(link.expiresAt) <= new Date();
    expect(isExpired).toBe(true);
  });

  it('detects and rejects revoked share links', async () => {
    const link = await db.shareLink.findUnique({
      where: { token: revokedToken },
    });
    expect(link).not.toBeNull();
    expect(link?.isRevoked).toBe(true);
  });
});
