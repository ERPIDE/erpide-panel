import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ORG = "ERPIDE";

const repoMap: Record<string, string> = {
  CANIAS: "erpide-canias-erp",
  "1C ERP": "erpide-1c-erp",
};

const reverseRepoMap: Record<string, string> = {
  "erpide-canias-erp": "CANIAS",
  "erpide-1c-erp": "1C ERP",
};

const clientMap: Record<string, string> = {
  CANIAS: "Sirmersan",
  "1C ERP": "ATM Constructor",
};

async function ghFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
    next: { revalidate: 0 },
  });
}

function parseBody(body: string) {
  let client = "";
  let deadline = "";
  let description = body || "";

  const clientMatch = body.match(/\*\*Müşteri:\*\*\s*(.+?)(?:\n|\||$)/);
  if (clientMatch) client = clientMatch[1].trim();

  const deadlineMatch = body.match(/\*\*Deadline:\*\*\s*(.+?)(?:\n|\||$)/);
  if (deadlineMatch) deadline = deadlineMatch[1].trim();

  // Clean description — remove metadata section
  const sepIdx = description.indexOf("\n---\n");
  if (sepIdx > -1) description = description.substring(0, sepIdx).trim();

  // Clean markdown headers
  description = description.replace(/^## Açıklama\n?/m, "").trim();

  return { client, deadline, description };
}

// GET /api/tasks
export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const allTasks = [];

    for (const [project, repo] of Object.entries(repoMap)) {
      const res = await ghFetch(
        `https://api.github.com/repos/${ORG}/${repo}/issues?state=all&per_page=100`
      );
      if (!res.ok) continue;

      const issues = await res.json();
      for (const issue of issues) {
        if (issue.pull_request) continue;

        const labels = issue.labels.map((l: { name: string }) => l.name);
        const label = labels.find((l: string) =>
          ["bug", "feature", "improvement", "docs", "urgent"].includes(l)
        ) || "feature";
        const priority = labels.includes("urgent") ? "high" : "medium";
        const status = issue.state === "closed"
          ? "done"
          : labels.includes("in-progress")
          ? "in_progress"
          : labels.includes("review")
          ? "review"
          : "todo";

        const parsed = parseBody(issue.body || "");
        const client = parsed.client || clientMap[project] || "";

        allTasks.push({
          id: issue.number,
          repo,
          project,
          client,
          title: issue.title,
          description: parsed.description,
          label,
          status,
          priority,
          deadline: parsed.deadline || undefined,
          createdAt: issue.created_at.split("T")[0],
          createdBy: issue.user?.login || "unknown",
          url: issue.html_url,
          commentsCount: issue.comments,
          comments: [],
          attachments: [],
          devNote: "",
        });
      }
    }

    return NextResponse.json(allTasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { title, description, project, label, priority, client } = body;

    const repo = repoMap[project];
    if (!repo) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }

    const labels = [label || "feature"];
    if (priority === "critical" || priority === "high") labels.push("urgent");

    const issueBody = `${description}\n\n---\n**Müşteri:** ${client || clientMap[project] || "N/A"}\n**Öncelik:** ${priority}\n**Oluşturan:** Panel`;

    const res = await ghFetch(
      `https://api.github.com/repos/${ORG}/${repo}/issues`,
      {
        method: "POST",
        body: JSON.stringify({ title, body: issueBody, labels }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message }, { status: res.status });
    }

    const issue = await res.json();
    return NextResponse.json({ id: issue.number, url: issue.html_url, message: "Task oluşturuldu" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
