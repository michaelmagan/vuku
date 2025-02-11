import { CommitType, EmojiMap } from "./types";

export const COMMIT_TYPES: CommitType[] = [
  { name: "✨ feat: A new feature", value: "feat" },
  { name: "🐛 fix: A bug fix", value: "fix" },
  { name: "📚 docs: Documentation only changes", value: "docs" },
  {
    name: "💎 style: Changes that do not affect the meaning of the code",
    value: "style",
  },
  {
    name: "♻️ refactor: A code change that neither fixes a bug nor adds a feature",
    value: "refactor",
  },
  { name: "⚡️ perf: A code change that improves performance", value: "perf" },
  {
    name: "🧪 test: Adding missing tests or correcting existing tests",
    value: "test",
  },
  {
    name: "🏗️ build: Changes that affect the build system or external dependencies",
    value: "build",
  },
  { name: "👷 ci: Changes to CI configuration files and scripts", value: "ci" },
  {
    name: "🔧 chore: Other changes that don't modify src or test files",
    value: "chore",
  },
  { name: "⏪ revert: Reverts a previous commit", value: "revert" },
];

export const EMOJI_MAP: EmojiMap = {
  feat: "✨",
  fix: "🐛",
  docs: "📚",
  style: "💎",
  refactor: "♻️",
  perf: "⚡️",
  test: "🧪",
  build: "🏗️",
  ci: "👷",
  chore: "🔧",
  revert: "⏪",
};

export const BRANCH_TYPES = [
  { name: "feature - For new features", value: "feature" },
  { name: "bugfix - For bug fixes", value: "bugfix" },
  { name: "hotfix - For urgent fixes", value: "hotfix" },
  { name: "release - For release branches", value: "release" },
  { name: "support - For support branches", value: "support" },
];

export const MAIN_BRANCHES = ["main", "master"];
