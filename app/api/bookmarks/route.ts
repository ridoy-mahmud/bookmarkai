import { NextResponse } from "next/server";
import { Collection, ObjectId } from "mongodb";
import { getDbName, getMongoClient } from "../../../lib/mongodb";
import { defaultAiTools } from "../../../data/ai-tools";
import { isAdminFromCookies } from "../../../lib/auth";

type BookmarkDoc = {
  _id?: ObjectId;
  name: string;
  url: string;
  order: number;
  type?: string;
  region?: string;
};

async function getCollection(): Promise<Collection<BookmarkDoc>> {
  const client = await getMongoClient();
  const db = client.db(getDbName());
  return db.collection<BookmarkDoc>("bookmarks");
}

async function ensureSeeded(col: Collection<BookmarkDoc>) {
  const count = await col.estimatedDocumentCount();
  if (count === 0) {
    const docs: BookmarkDoc[] = defaultAiTools.map((t, i) => ({
      name: t.name,
      url: t.url,
      type: t.type,
      region: t.region,
      order: i,
    }));
    await col.insertMany(docs);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reseed = searchParams.get("reseed");

    const col = await getCollection();
    if (reseed === "1" || reseed === "true") {
      await col.deleteMany({});
    }
    await ensureSeeded(col);

    const docs = await col.find().sort({ order: 1, _id: 1 }).toArray();
    return NextResponse.json(
      docs.map((d) => ({ id: d._id?.toString(), name: d.name, url: d.url, order: d.order, type: d.type, region: d.region }))
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, url, type, region } = body as { name?: string; url?: string; type?: string; region?: string };
    if (!name || !url) return NextResponse.json({ error: "name and url required" }, { status: 400 });

    const col = await getCollection();
    const max = await col.find().sort({ order: -1 }).limit(1).toArray();
    const nextOrder = (max[0]?.order ?? -1) + 1;
    const result = await col.insertOne({ name, url, type, region, order: nextOrder });
    return NextResponse.json({ id: result.insertedId.toString(), name, url, type, region, order: nextOrder }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to add" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  // Reorder or full replace: takes an array of {id}
  try {
    const body = await req.json();
    const { ids } = body as { ids?: string[] };
    if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: "ids array required" }, { status: 400 });
    const col = await getCollection();
    await Promise.all(
      ids.map((id, idx) => col.updateOne({ _id: new ObjectId(id) }, { $set: { order: idx } }))
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to reorder" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await isAdminFromCookies())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, name, url, type, region } = body as { id?: string; name?: string; url?: string; type?: string; region?: string };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (url !== undefined) update.url = url;
    if (type !== undefined) update.type = type;
    if (region !== undefined) update.region = region;
    const col = await getCollection();
    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await isAdminFromCookies())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const col = await getCollection();
    await col.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete" }, { status: 500 });
  }
}


