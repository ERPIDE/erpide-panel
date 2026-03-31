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

const statusToLabels: Record<string, { add: string[]; remove: string[] }> = {
  todo: { add: [], remove: ["in-progress", "review"] },
  in_progress: { add: ["in-progress"], remove: ["review"] },
  review: { add: ["review"], remove: ["in-progress"] },
  done: { add: [], remove: ["in-progress", "review"] },
};

// PATCH /api/tasks/update — update task status, labels, or add dev note
export async function PATCH(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { repo, issueNumber, status, devNote } = body;

    if (!repo || !issueNumber) {
      return NextResponse.json({ error: "repo and issueNumber required" }, { status: 400 });
    }

    // Update status via labels
    if (status) {
      // Get current labels
      const issueRes = await ghFetch(
        `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}`
      );
      if (!issueRes.ok) {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
      }
      const issue = await issueRes.json();
      const currentLabels: string[] = issue.labels.map((l: { name: string }) => l.name);

      const changes = statusToLabels[status];
      if (changes) {
        let newLabels = currentLabels.filter((l) => !changes.remove.includes(l));
        for (const label of changes.add) {
          if (!newLabels.includes(label)) newLabels.push(label);
        }

        // Close or reopen issue based on status
        const state = status === "done" ? "closed" : "open";

        await ghFetch(
          `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}`,
          {
            method: "PATCH",
            body: JSON.stringify({ labels: newLabels, state }),
          }
        );
      }
    }

    // Add dev note as a comment
    if (devNote !== undefined) {
      await ghFetch(
        `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}/comments`,
        {
          method: "POST",
          body: JSON.stringify({
            body: `**ERPIDE Dev Notu:**\n\n${devNote}`,
          }),
        }
      );
    }

    return NextResponse.json({ message: "Guncellendi" });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Guncellenemedi" }, { status: 500 });
  }
}
