export async function onRequestGet(context) {
  try {
    const { env } = context;
    // D1 データベースから取得
    const { results } = await env.DB.prepare(
      "SELECT * FROM schedules ORDER BY date ASC, time ASC"
    ).all();

    return new Response(JSON.stringify(results || []), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const data = await request.json();

    if (!data.date) {
      return new Response(JSON.stringify({ error: "日付は必須です。" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const date = data.date;
    const time = data.time || "19:00";
    const place = data.place || "";
    const kind = data.kind || "練習";
    const memo = data.memo || "";
    const createdAt = Date.now();

    const info = await env.DB.prepare(
      "INSERT INTO schedules (date, time, place, kind, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(date, time, place, kind, memo, createdAt)
      .run();

    return new Response(JSON.stringify({ success: true, id: info.meta.last_row_id }), {
      status: 201,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

export async function onRequestDelete(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "IDが指定されていません。" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    await env.DB.prepare("DELETE FROM schedules WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
