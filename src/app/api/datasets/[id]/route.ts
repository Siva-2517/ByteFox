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

    const dataset = await db.dataset.findFirst({
      where: { id, userId: session.id },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Fetch preview rows (first 25 rows)
    const previewRows = await db.datasetRow.findMany({
      where: { datasetId: id },
      orderBy: { rowNumber: 'asc' },
      take: 25,
    });

    return NextResponse.json({
      dataset: {
        id: dataset.id,
        name: dataset.name,
        filename: dataset.filename,
        fileSizeBytes: dataset.fileSizeBytes,
        rowCount: dataset.rowCount,
        unparseableCount: dataset.unparseableCount,
        columns: JSON.parse(dataset.columns),
        unparseableRows: JSON.parse(dataset.unparseableRows),
        createdAt: dataset.createdAt,
      },
      previewRows: previewRows.map((r) => ({
        rowNumber: r.rowNumber,
        data: JSON.parse(r.data),
      })),
    });
  } catch (error: any) {
    console.error('Fetch dataset detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dataset' },
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

    const dataset = await db.dataset.findFirst({
      where: { id, userId: session.id },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    await db.dataset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete dataset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}
