import { execFile } from "node:child_process";

import type { CommitResult, GitStatus } from "./types";

const ROOT = process.cwd();
const MAX_BUFFER = 2 * 1024 * 1024;

interface GitRunResult {
  stdout: string;
  stderr: string;
}

function runGit(args: string[], timeout = 20_000): Promise<GitRunResult> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      {
        cwd: ROOT,
        timeout,
        windowsHide: true,
        maxBuffer: MAX_BUFFER,
        encoding: "utf8",
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            Object.assign(error, {
              stdout: String(stdout ?? ""),
              stderr: String(stderr ?? ""),
            }),
          );
          return;
        }
        resolve({ stdout: String(stdout ?? ""), stderr: String(stderr ?? "") });
      },
    );
  });
}

function messageOf(error: unknown): string {
  if (error && typeof error === "object") {
    const value = error as { stderr?: string; stdout?: string; message?: string };
    return (
      (value.stderr && value.stderr.trim()) ||
      (value.stdout && value.stdout.trim()) ||
      value.message ||
      "Git 操作失败"
    );
  }
  return "Git 操作失败";
}

export async function getGitStatus(): Promise<GitStatus> {
  try {
    const inside = await runGit(["rev-parse", "--is-inside-work-tree"], 8000);
    if (inside.stdout.trim() !== "true") {
      return { isRepo: false, changes: [] };
    }
  } catch {
    return { isRepo: false, changes: [] };
  }

  try {
    const [branch, head, status] = await Promise.all([
      runGit(["rev-parse", "--abbrev-ref", "HEAD"], 8000),
      runGit(["rev-parse", "--short", "HEAD"], 8000).catch(() => ({ stdout: "", stderr: "" })),
      runGit(["status", "--porcelain=v1"], 12_000),
    ]);

    const changes = status.stdout
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .slice(0, 80)
      .map((line) => ({
        code: line.slice(0, 2).trim() || "??",
        path: line.slice(3).trim(),
      }));

    return {
      isRepo: true,
      branch: branch.stdout.trim() || "main",
      head: head.stdout.trim() || undefined,
      clean: changes.length === 0,
      changes,
    };
  } catch (error) {
    return {
      isRepo: true,
      clean: false,
      changes: [],
      error: messageOf(error),
    };
  }
}

export async function commitAll(message: string): Promise<CommitResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("请填写 Commit Message。");
  }
  if (trimmed.length > 200) {
    throw new Error("Commit Message 不能超过 200 字。");
  }

  const status = await getGitStatus();
  if (!status.isRepo) {
    throw new Error("当前目录还不是 Git 仓库，请先执行 git init。");
  }
  if (status.clean) {
    return { committed: false, reason: "没有需要提交的更改。" };
  }

  try {
    await runGit(["add", "-A"]);
    const result = await runGit(["commit", "-m", trimmed], 30_000);
    const head = await runGit(["rev-parse", "--short", "HEAD"], 8000);
    return {
      committed: true,
      hash: head.stdout.trim(),
      branch: status.branch,
      output: result.stdout.trim().split(/\r?\n/).slice(0, 6).join("\n"),
    };
  } catch (error) {
    throw new Error(messageOf(error));
  }
}
