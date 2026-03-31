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
    const { repo, issueNumber, status, devNote, customDate, title, description } = body;

    if (!repo || !issueNumber) {
      return NextResponse.json({ error: "repo and issueNumber required" }, { status: 400 });
    }

    // Update title and/or description
    if (title || description) {
      const updateBody: Record<string, string> = {};
      if (title) updateBody.title = title;
      if (description) {
        // Rebuild issue body with metadata preserved
        const issueRes = await ghFetch(
          `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}`
        );
        if (issueRes.ok) {
          const issue = await issueRes.json();
          const oldBody: string = issue.body || "";
          const sepIdx = oldBody.indexOf("\n---\n");
          const metadata = sepIdx > -1 ? oldBody.substring(sepIdx) : "";
          updateBody.body = description + metadata;
        }
      }
      await ghFetch(
        `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}`,
        { method: "PATCH", body: JSON.stringify(updateBody) }
      );
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

    // Update custom date in issue body
    if (customDate) {
      const issueRes2 = await ghFetch(
        `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}`
      );
      if (issueRes2.ok) {
        const issue = await issueRes2.json();
        let issueBody: string = issue.body || "";

        // Replace or add **Tarih:** field
        if (issueBody.match(/\*\*Tarih:\*\*\s*.+/)) {
          issueBody = issueBody.replace(/\*\*Tarih:\*\*\s*.+/, `**Tarih:** ${customDate}`);
        } else {
          // Add before --- separator or at end
          const sepIdx = issueBody.indexOf("\n---\n");
          if (sepIdx > -1) {
            issueBody = issueBody.substring(0, sepIdx) + `\n**Tarih:** ${customDate}` + issueBody.substring(sepIdx);
          } else {
            issueBody += `\n\n---\n**Tarih:** ${customDate}`;
          }
        }

        await ghFetch(
          `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}`,
          {
            method: "PATCH",
            body: JSON.stringify({ body: issueBody }),
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

// DELETE /api/tasks/update — close and label a task as deleted
export async function DELETE(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");
    const issueNumber = searchParams.get("issueNumber");

    if (!repo || !issueNumber) {
      return NextResponse.json({ error: "repo and issueNumber required" }, { status: 400 });
    }

    // Close the issue and add "silindi" label
    await ghFetch(
      `https://api.github.com/repos/${ORG}/${repo}/issues/${issueNumber}`,
      {
        method: "PATCH",
        body: JSON.stringify({ state: "closed", labels: ["silindi"] }),
      }
    );

    return NextResponse.json({ message: "Task silindi" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Task silinemedi" }, { status: 500 });
  }
}
