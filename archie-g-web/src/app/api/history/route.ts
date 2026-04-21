import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const history = await db.all("SELECT * FROM analyses ORDER BY timestamp DESC");
    
    // Transform SQLite 0/1 to boolean for the frontend
    const transformed = history.map(item => ({
      ...item,
      is_pinned: !!item.is_pinned
    }));

    return NextResponse.json({ history: transformed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, id, item } = await req.json();
    const db = await getDb();

    if (action === "save") {
      await db.run(
        `INSERT OR REPLACE INTO analyses (id, timestamp, project_root, path, analysis, provider, model, is_pinned)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.timestamp, item.project_root, item.path, item.analysis, item.provider, item.model, item.is_pinned ? 1 : 0]
      );
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      await db.run("DELETE FROM analyses WHERE id = ?", [id]);
      return NextResponse.json({ success: true });
    }

    if (action === "clear") {
      await db.run("DELETE FROM analyses");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
