import { CommitAnswers } from "../types";
import { EMOJI_MAP } from "../constants";

export class FormatterService {
  constructor(private skipEmoji: boolean = false) {}

  formatCommitMessage(answers: CommitAnswers): string {
    const { type, scope, description, hasBreaking, body, footer } = answers;
    const emoji = this.skipEmoji ? "" : `${EMOJI_MAP[type]} `;
    const scopeStr = scope ? `(${scope})` : "";
    const breakingStr = hasBreaking ? "!" : "";

    let message = `${emoji}${type}${scopeStr}${breakingStr}: ${description}`;

    if (body) {
      message += `\n\n${body}`;
    }

    if (hasBreaking) {
      message +=
        "\n\nBREAKING CHANGE: This commit introduces breaking changes.";
    }

    if (footer) {
      message += `\n\n${footer}`;
    }

    return message;
  }

  formatBranchName(branchType: string, branchName: string): string {
    return `${branchType}/${branchName.toLowerCase().replace(/\s+/g, "-")}`;
  }
}
