import { NextRequest, NextResponse } from "next/server";

// GitHub API config
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ORG = "ERPIDE";

const repoMap: Record<string, string> = {
  "CANIAS": "erpide-canias-erp",
  "1C ERP": "erpide-1c-erp",
  "Python Botları": "erpide-python-bots",
  "Kripto Botu": "erpide-crypto-bot",
};

const labelMap: Record<string, string> = {
  bug: "bug",
  feature: "feature",
  improvement: "improvement",
  docs: "docs",
  urgent: "urgent",
};

const priorityToLabel: Record<string, string> = {
  critical: "urgent",
  high: "urgent",
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
  });
}

// GET /api/tasks — list all issues from all repos
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
        if (issue.pull_request) continue; // skip PRs

        const labels = issue.labels.map((l: { name: string }) => l.name);
        const priority = labels.includes("urgent") ? "high" :
                        labels.includes("improvement") ? "medium" : "medium";
        const label = labels.find((l: string) => ["bug", "feature", "improvement", "docs", "urgent"].includes(l)) || "feature";
        const status = issue.state === "closed" ? "done" :
                      labels.includes("in-progress") ? "in_progress" :
                      labels.includes("review") ? "review" : "todo";

        allTasks.push({
          id: issue.number,
          githubId: issue.id,
          repo,
          project,
          title: issue.title,
          description: issue.body || "",
          label,
          status,
          priority,
          createdAt: issue.created_at.split("T")[0],
          createdBy: issue.user?.login || "unknown",
          url: issue.html_url,
          commentsCount: issue.comments,
        });
      }
    }

    return NextResponse.json(allTasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks — create a new issue
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

    const labels = [labelMap[label] || "feature"];
    if (priority === "critical" || priority === "high") {
      labels.push("urgent");
    }

    const issueBody = `${description}\n\n---\n**Müşteri:** ${client || "N/A"}\n**Öncelik:** ${priority}\n**Oluşturan:** Panel`;

    const res = await ghFetch(
      `https://api.github.com/repos/${ORG}/${repo}/issues`,
      {
        method: "POST",
        body: JSON.stringify({
          title,
          body: issueBody,
          labels,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message }, { status: res.status });
    }

    const issue = await res.json();
    return NextResponse.json({
      id: issue.number,
      url: issue.html_url,
      message: "Task oluşturuldu",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
