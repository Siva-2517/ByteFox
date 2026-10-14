import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const report = await db.report.findFirst({
      where: { id, userId: session.id },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            filename: true,
            rowCount: true,
            unparseableCount: true,
            columns: true,
          },
        },
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
        shareLinks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      report: {
        id: report.id,
        title: report.title,
        description: report.description,
        globalFilters: JSON.parse(report.globalFilters || '{}'),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        dataset: {
          id: report.dataset.id,
          name: report.dataset.name,
          filename: report.dataset.filename,
          rowCount: report.dataset.rowCount,
          unparseableCount: report.dataset.unparseableCount,
          columns: JSON.parse(report.dataset.columns),
        },
        blocks: report.blocks.map((b) => ({
          id: b.id,
          orderIndex: b.orderIndex,
          blockType: b.blockType,
          title: b.title,
          config: JSON.parse(b.config),
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),
        shareLinks: report.shareLinks.map((s) => ({
          id: s.id,
          token: s.token,
          expiresAt: s.expiresAt,
          isRevoked: s.isRevoked,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Fetch report detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, globalFilters } = body;

    const report = await db.report.findFirst({
      where: { id, userId: session.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const updated = await db.report.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(globalFilters !== undefined && { globalFilters: JSON.stringify(globalFilters) }),
      },
    });

    return NextResponse.json({
      report: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        globalFilters: JSON.parse(updated.globalFilters),
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const report = await db.report.findFirst({
      where: { id, userId: session.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await db.report.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete report' },
      { status: 500 }
    );
  }
}
