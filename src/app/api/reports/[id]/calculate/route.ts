import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { executeAndAuditBlock } from '@/lib/audit-engine';
import { BlockType, GlobalFilters } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const url = new URL(request.url);
    const shareToken = url.searchParams.get('token');

    let isAuthorized = false;

    // Check share token first if provided
    if (shareToken) {
      const shareLink = await db.shareLink.findFirst({
        where: {
          token: shareToken,
          reportId,
          isRevoked: false,
        },
      });

      if (shareLink) {
        if (!shareLink.expiresAt || new Date(shareLink.expiresAt) > new Date()) {
          isAuthorized = true;
        }
      }
    }

    // Check user session if not authorized via share token
    if (!isAuthorized) {
      const session = await getSession();
      if (session) {
        const report = await db.report.findFirst({
          where: { id: reportId, userId: session.id },
          select: { id: true },
        });
        if (report) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized or link expired' }, { status: 403 });
    }

    // Fetch report, blocks, and dataset rows
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        dataset: {
          select: {
            id: true,
            rowCount: true,
            unparseableCount: true,
          },
        },
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { blockId, segmentFilter } = body;

    const globalFilters: GlobalFilters = JSON.parse(report.globalFilters || '{}');

    // Fetch all valid rows for dataset
    const rows = await db.datasetRow.findMany({
      where: { datasetId: report.datasetId, isValid: true },
      select: { rowNumber: true, data: true },
      orderBy: { rowNumber: 'asc' },
    });

    const parsedRows = rows.map((r) => ({
      rowNumber: r.rowNumber,
      data: JSON.parse(r.data),
    }));

    if (blockId) {
      // Execute single block (e.g. for "How was this calculated?" audit modal)
      const targetBlock = report.blocks.find((b) => b.id === blockId);
      if (!targetBlock) {
        return NextResponse.json({ error: 'Block not found' }, { status: 404 });
      }

      const audit = executeAndAuditBlock({
        blockType: targetBlock.blockType as BlockType,
        config: JSON.parse(targetBlock.config),
        title: targetBlock.title || undefined,
        rows: parsedRows,
        totalDatasetRows: report.dataset.rowCount,
        unparseableCount: report.dataset.unparseableCount,
        globalFilters,
        segmentFilter,
      });

      return NextResponse.json({ audit });
    }

    // Execute all blocks for report rendering
    const results: Record<string, any> = {};

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

      results[b.id] = audit;
    }

    return NextResponse.json({
      results,
      globalFilters,
    });
  } catch (error: any) {
    console.error('Calculate report error:', error);
    return NextResponse.json(
      { error: error.message || 'Calculation engine failed' },
      { status: 500 }
    );
  }
}
