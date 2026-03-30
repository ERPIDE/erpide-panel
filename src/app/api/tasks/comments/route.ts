import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ORG = "ERPIDE";

async function ghFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

// POST /api/tasks/comments — add comment to issue
export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { repo, issueNumber, comment, author } = body;

    const commentBody = `**${author}:**\n\n${comment}`;

    const res = await ghFetch(
      `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ body: commentBody }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message }, { status: res.status });
    }

    const result = await res.json();
    return NextResponse.json({ id: result.id, message: "Yorum eklendi" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

// GET /api/tasks/comments?repo=xxx&issue=123 — get comments for issue
export async function GET(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");
  const issue = searchParams.get("issue");

  if (!repo || !issue) {
    return NextResponse.json({ error: "repo and issue required" }, { status: 400 });
  }

  try {
    const res = await ghFetch(
      `https://api.github.com/repos/${ORG}/${repo}/issues/${issue}/comments?per_page=100`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch" }, { status: res.status });
    }

    const comments = await res.json();
    return NextResponse.json(
      comments.map((c: { id: number; user: { login: string }; body: string; created_at: string }) => ({
        id: c.id,
        author: c.user.login,
        text: c.body,
        date: c.created_at.split("T")[0],
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
