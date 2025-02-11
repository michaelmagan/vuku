#!/usr/bin/env node

import inquirer from "inquirer";
import { Command } from "commander";
import chalk from "chalk";
import simpleGit from "simple-git";

interface CommitType {
  name: string;
  value: string;
}

interface CommitAnswers {
  createBranch: boolean;
  branchType: string;
  branchName: string;
  type: string;
  scope: string;
  description: string;
  hasBreaking: boolean;
  body: string;
  footer: string;
}

interface EmojiMap {
  [key: string]: string;
}

const git = simpleGit();
const program = new Command();

const COMMIT_TYPES: CommitType[] = [
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

const EMOJI_MAP: EmojiMap = {
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

const BRANCH_TYPES = [
  { name: "feature - For new features", value: "feature" },
  { name: "bugfix - For bug fixes", value: "bugfix" },
  { name: "hotfix - For urgent fixes", value: "hotfix" },
  { name: "release - For release branches", value: "release" },
  { name: "support - For support branches", value: "support" },
];

program
  .name("vuku")
  .description(
    "Interactive git branch and commit message generator following conventional commits"
  )
  .version("1.0.0")
  .option("-s, --skip-emoji", "Skip adding emojis to commit messages")
  .addHelpText(
    "after",
    `
Example usage:
  $ vuku
  $ vuku --skip-emoji

The tool will guide you through:
1. Creating a new branch (optional)
2. Creating a conventional commit message with:
   - Type of change (feat, fix, docs, etc.)
   - Scope (optional)
   - Description
   - Breaking changes indicator
   - Extended description (optional)
   - Footer notes (optional)`
  )
  .parse(process.argv);

const options = program.opts();

async function getCurrentBranch(): Promise<string> {
  try {
    const status = await git.status();
    return status.current ?? "";
  } catch (error) {
    console.error(
      chalk.red("Error getting current branch:"),
      (error as Error).message
    );
    process.exit(1);
  }
}

async function generateCommitMessage(): Promise<void> {
  const currentBranch = await getCurrentBranch();
  const isOnMainBranch = ["main", "master"].includes(currentBranch);

  let createBranch = false;
  if (isOnMainBranch) {
    console.log(
      chalk.yellow(`⚠️  You are currently on ${currentBranch} branch.`)
    );
    console.log(
      chalk.yellow("It is recommended to create a new branch for your changes.")
    );
    const { shouldCreateBranch } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldCreateBranch",
        message: "Would you like to create a new branch?",
        default: true,
      },
    ]);

    if (!shouldCreateBranch) {
      const { confirmContinue } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmContinue",
          message: chalk.red(
            "Are you sure you want to commit directly to " + currentBranch + "?"
          ),
          default: false,
        },
      ]);

      if (!confirmContinue) {
        console.log(chalk.blue("Operation cancelled"));
        process.exit(0);
      }
    }

    createBranch = shouldCreateBranch;
  } else {
    const { shouldCreateBranch } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldCreateBranch",
        message: "Would you like to create a new branch?",
        default: false,
      },
    ]);
    createBranch = shouldCreateBranch;
  }

  const answers: CommitAnswers = await inquirer.prompt([
    {
      type: "list",
      name: "branchType",
      message: "Select the type of branch:",
      choices: BRANCH_TYPES,
      when: () => createBranch,
    },
    {
      type: "input",
      name: "branchName",
      message: "Enter the branch name (without the type prefix):",
      when: () => createBranch,
      validate: (input: string) => {
        if (input.length === 0) return "Branch name is required";
        if (!/^[a-z0-9-_]+$/i.test(input)) {
          return "Branch name can only contain letters, numbers, hyphens and underscores";
        }
        return true;
      },
    },
    {
      type: "list",
      name: "type",
      message: "Select the type of change you're committing:",
      choices: COMMIT_TYPES,
    },
    {
      type: "input",
      name: "scope",
      message: "Enter the scope of this change (optional):",
    },
    {
      type: "input",
      name: "description",
      message: "Enter a short description:",
      validate: (input: string) =>
        input.length > 0 ? true : "Description is required",
    },
    {
      type: "confirm",
      name: "hasBreaking",
      message: "Are there any breaking changes?",
      default: false,
    },
    {
      type: "input",
      name: "body",
      message: "Enter a longer description (optional):",
    },
    {
      type: "input",
      name: "footer",
      message: "Enter any footer notes (optional):",
    },
  ]);

  if (createBranch) {
    const branchFullName = `${answers.branchType}/${answers.branchName}`;
    try {
      await git.checkoutLocalBranch(branchFullName);
      console.log(
        chalk.green(`✅ Created and switched to branch: ${branchFullName}`)
      );
    } catch (error: unknown) {
      console.error(
        chalk.red("Error creating branch:"),
        (error as Error).message
      );
      return;
    }
  }

  const emoji = options.skipEmoji ? "" : `${EMOJI_MAP[answers.type]} `;
  const scope = answers.scope ? `(${answers.scope})` : "";
  const breaking = answers.hasBreaking ? "!" : "";

  let commitMessage = `${emoji}${answers.type}${scope}${breaking}: ${answers.description}`;

  if (answers.body) {
    commitMessage += `\n\n${answers.body}`;
  }

  if (answers.footer) {
    commitMessage += `\n\n${answers.footer}`;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Commit message preview:\n\n${chalk.green(
        commitMessage
      )}\n\nProceed with commit?`,
      default: true,
    },
  ]);

  if (confirm) {
    try {
      await git.commit(commitMessage);
      console.log(chalk.green("✅ Successfully created commit!"));
    } catch (error: unknown) {
      console.error(
        chalk.red("Error creating commit:"),
        (error as Error).message
      );
    }
  }
}

generateCommitMessage().catch(console.error);
