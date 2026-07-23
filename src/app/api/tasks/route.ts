import { NextRequest, NextResponse } from "next/server";
import { getPrisma, HAS_DB } from "@/lib/db";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ORG = "ERPIDE";

// DB'ye erişilemezse (lokal dev, migration öncesi) kullanılacak yedek harita.
const FALLBACK_PROJECTS = [
  { name: "CANIAS", repo: "erpide-canias-erp", client: "Sirmersan" },
  { name: "1C ERP", repo: "erpide-1c-erp", client: "ATM Constructor" },
];

/** Proje tanımlarını DB'den okur: name→repo ve name→müşteri adı haritaları.
 *  Project tablosu boşsa/erişilemezse hardcoded fallback'e düşer. */
async function loadProjectMaps(): Promise<{
  repoMap: Record<string, string>;
  clientMap: Record<string, string>;
}> {
  let rows = FALLBACK_PROJECTS;
  if (HAS_DB) {
    try {
      const projects = await getPrisma().project.findMany({
        include: { customer: { select: { name: true } } },
      });
      if (projects.length > 0) {
        rows = projects.map((p) => ({ name: p.name, repo: p.repo, client: p.customer?.name || "" }));
      }
    } catch {
      // DB hatasında fallback ile devam — task listesi boş dönmesin.
    }
  }
  const repoMap: Record<string, string> = {};
  const clientMap: Record<string, string> = {};
  for (const r of rows) {
    repoMap[r.name] = r.repo;
    clientMap[r.name] = r.client;
  }
  return { repoMap, clientMap };
}

const userDisplayNames: Record<string, string> = {
  alimuratel: "Ali Murat EL",
};
function displayName(login: string): string {
  return userDisplayNames[login] || login;
}

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
  let customDate = "";
  let creator = "";
  let priorityScore = 0;
  let description = body || "";

  const clientMatch = body.match(/\*\*Müşteri:\*\*\s*(.+?)(?:\n|\||$)/);
  if (clientMatch) client = clientMatch[1].trim();

  const deadlineMatch = body.match(/\*\*Deadline:\*\*\s*(.+?)(?:\n|\||$)/);
  if (deadlineMatch) deadline = deadlineMatch[1].trim();

  const dateMatch = body.match(/\*\*Tarih:\*\*\s*(.+?)(?:\n|\||$)/);
  if (dateMatch) customDate = dateMatch[1].trim();

  const creatorMatch = body.match(/\*\*Oluşturan:\*\*\s*(.+?)(?:\n|\||$)/);
  if (creatorMatch) creator = creatorMatch[1].trim();

  const scoreMatch = body.match(/\*\*Öncelik Puanı:\*\*\s*(\d+)/);
  if (scoreMatch) priorityScore = parseInt(scoreMatch[1], 10);

  // Clean description — remove metadata section
  const sepIdx = description.indexOf("\n---\n");
  if (sepIdx > -1) description = description.substring(0, sepIdx).trim();

  // Clean markdown
  description = description
    .replace(/^##\s+.+$/gm, "")
    .replace(/\*\*Müşteri:\*\*\s*.+$/gm, "")
    .replace(/\*\*Deadline:\*\*\s*.+$/gm, "")
    .replace(/\*\*Öncelik:\*\*\s*.+$/gm, "")
    .replace(/\*\*Oluşturan:\*\*\s*.+$/gm, "")
    .replace(/\*\*Tarih:\*\*\s*.+$/gm, "")
    .replace(/\*\*Öncelik Puanı:\*\*\s*.+$/gm, "")
    .replace(/\|[^\n]+\|/g, "")
    .replace(/[-]{3,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { client, deadline, customDate, creator, description, priorityScore };
}

// GET /api/tasks
export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const allTasks = [];
    const debugInfo: string[] = [];
    const { repoMap, clientMap } = await loadProjectMaps();

    for (const [project, repo] of Object.entries(repoMap)) {
      const res = await ghFetch(
        `https://api.github.com/repos/${ORG}/${repo}/issues?state=all&per_page=100`
      );
      if (!res.ok) {
        debugInfo.push(`${repo}: ${res.status} ${res.statusText}`);
        continue;
      }

      const issues = await res.json();
      for (const issue of issues) {
        if (issue.pull_request) continue;
        const issueLabels = issue.labels.map((l: { name: string }) => l.name);
        if (issueLabels.includes("silindi")) continue;

        const labels = issue.labels.map((l: { name: string }) => l.name);
        const label = labels.find((l: string) =>
          ["bug", "feature", "improvement", "docs", "urgent"].includes(l)
        ) || "feature";
        const defaultPriority = labels.includes("urgent") ? "high" : "medium";
        const status = issue.state === "closed"
          ? "done"
          : labels.includes("in-progress")
          ? "in_progress"
          : labels.includes("review")
          ? "review"
          : "todo";

        const parsed = parseBody(issue.body || "");
        const client = parsed.client || clientMap[project] || "";

        // Fetch comments to extract devNote and attachments
        let devNote = "";
        const attachments: { id: string; name: string; type: "image" | "document" | "screenshot"; url: string; date: string }[] = [];

        if (issue.comments > 0) {
          try {
            const commentsRes = await ghFetch(
              `https://api.github.com/repos/${ORG}/${repo}/issues/${issue.number}/comments?per_page=100`
            );
            if (commentsRes.ok) {
              const comments = await commentsRes.json();
              for (const c of comments) {
                const body: string = c.body || "";
                // Extract dev notes
                if (body.startsWith("**ERPIDE Dev Notu:**")) {
                  devNote = body.replace("**ERPIDE Dev Notu:**", "").trim();
                }
                // Extract file attachments
                const attachMatch = body.match(/^\*\*Ek Dosya:\*\*\s*(?:\[(.+?)\]\((.+?)\)|(.+?)\n\n!\[(.+?)\]\((.+?)\))/);
                if (attachMatch) {
                  const name = attachMatch[1] || attachMatch[4] || "dosya";
                  const url = attachMatch[2] || attachMatch[5] || "";
                  const isImage = body.includes("![");
                  attachments.push({
                    id: String(c.id),
                    name,
                    type: isImage ? "image" : "document",
                    url,
                    date: c.created_at.split("T")[0],
                  });
                }
              }
            }
          } catch {}
        }

        allTasks.push({
          id: issue.number,
          repo,
          project,
          client,
          title: issue.title,
          description: parsed.description,
          label,
          status,
          priority: parsed.priorityScore > 0
            ? (parsed.priorityScore >= 9 ? "critical" : parsed.priorityScore >= 7 ? "high" : parsed.priorityScore >= 4 ? "medium" : "low")
            : defaultPriority,
          priorityScore: parsed.priorityScore || (defaultPriority === "high" ? 7 : 5),
          deadline: parsed.deadline || undefined,
          createdAt: parsed.customDate || issue.created_at.split("T")[0],
          closedAt: issue.closed_at ? issue.closed_at.split("T")[0] : undefined,
          createdBy: parsed.creator || displayName(issue.user?.login || "unknown"),
          url: issue.html_url,
          commentsCount: issue.comments,
          comments: [],
          attachments,
          devNote,
        });
      }
    }

    if (allTasks.length === 0 && debugInfo.length > 0) {
      return NextResponse.json({ error: "GitHub API errors", debug: debugInfo, hasToken: !!GITHUB_TOKEN }, { status: 200 });
    }
    return NextResponse.json(allTasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks", detail: String(error) }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { title, description, project, label, priority, priorityScore, client, createdBy } = body;

    const { repoMap, clientMap } = await loadProjectMaps();
    const repo = repoMap[project];
    if (!repo) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }

    const score = priorityScore || (priority === "critical" ? 10 : priority === "high" ? 7 : priority === "medium" ? 5 : 2);
    const labels = [label || "feature"];
    if (score >= 7) labels.push("urgent");

    const issueBody = `${description}\n\n---\n**Müşteri:** ${client || clientMap[project] || "N/A"}\n**Öncelik:** ${priority}\n**Öncelik Puanı:** ${score}\n**Oluşturan:** ${createdBy || "Panel"}`;

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
