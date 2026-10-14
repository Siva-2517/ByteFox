import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { executeAndAuditBlock } from '@/lib/audit-engine';
import { BlockType, GlobalFilters } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const shareLink = await db.shareLink.findUnique({
      where: { token },
      include: {
        report: {
          include: {
            dataset: {
              select: {
                name: true,
                rowCount: true,
                unparseableCount: true,
                columns: true,
              },
            },
            blocks: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Shared report link not found or invalid.' },
        { status: 404 }
      );
    }

    if (shareLink.isRevoked) {
      return NextResponse.json(
        {
          error: 'This report share link has been revoked by the owner.',
          status: 'revoked',
        },
        { status: 403 }
      );
    }

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) <= new Date()) {
      return NextResponse.json(
        {
          error: 'This report share link has expired.',
          status: 'expired',
          expiredAt: shareLink.expiresAt,
        },
        { status: 410 }
      );
    }

    const report = shareLink.report;
    const globalFilters: GlobalFilters = JSON.parse(report.globalFilters || '{}');

    // Fetch valid rows for calculations
    const rows = await db.datasetRow.findMany({
      where: { datasetId: report.datasetId, isValid: true },
      select: { rowNumber: true, data: true },
      orderBy: { rowNumber: 'asc' },
    });

    const parsedRows = rows.map((r) => ({
      rowNumber: r.rowNumber,
      data: JSON.parse(r.data),
    }));

    // Pre-calculate block outputs and audit logs on the server
    const blockResults: Record<string, any> = {};

    for (const b of report.blocks) {
      const config = JSON.parse(b.config);
      const audit = executeAndAuditBlock({
        blockType: b.blockType as BlockType,
        config,
        title: b.title || undefined,
        rows: parsedRows,
        totalDatasetRows: report.dataset.rowCount,
        unparseableCount: report.dataset.unparseableCount,
        globalFilters,
      });

      blockResults[b.id] = audit;
    }

    return NextResponse.json({
      report: {
        title: report.title,
        description: report.description,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        datasetName: report.dataset.name,
        datasetRowCount: report.dataset.rowCount,
        globalFilters,
        blocks: report.blocks.map((b) => ({
          id: b.id,
          orderIndex: b.orderIndex,
          blockType: b.blockType,
          title: b.title,
          config: JSON.parse(b.config),
        })),
        blockResults,
      },
      shareInfo: {
        token: shareLink.token,
        expiresAt: shareLink.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Fetch shared report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load shared report' },
      { status: 500 }
    );
  }
}
