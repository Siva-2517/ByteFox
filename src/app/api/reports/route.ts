import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await db.report.findMany({
      where: { userId: session.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        dataset: {
          select: { id: true, name: true, filename: true, rowCount: true },
        },
        _count: {
          select: { blocks: true, shareLinks: true },
        },
      },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        datasetId: r.datasetId,
        datasetName: r.dataset.name,
        datasetRows: r.dataset.rowCount,
        blockCount: r._count.blocks,
        shareCount: r._count.shareLinks,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Fetch reports error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { datasetId, title, description } = body;

    if (!datasetId || !title) {
      return NextResponse.json(
        { error: 'Dataset and report title are required.' },
        { status: 400 }
      );
    }

    // Verify dataset belongs to user
    const dataset = await db.dataset.findFirst({
      where: { id: datasetId, userId: session.id },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found or does not belong to you.' },
        { status: 404 }
      );
    }

    const report = await db.report.create({
      data: {
        userId: session.id,
        datasetId: dataset.id,
        title: title.trim(),
        description: description?.trim() || null,
        globalFilters: JSON.stringify({}),
      },
    });

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create report' },
      { status: 500 }
    );
  }
}
