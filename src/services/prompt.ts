import inquirer, { QuestionCollection } from "inquirer";
import chalk from "chalk";
import { CommitAnswers } from "../types";
import { BRANCH_TYPES, COMMIT_TYPES, MAIN_BRANCHES } from "../constants";
import { GitService } from "./git";

export class PromptService {
  constructor(private gitService: GitService) {}

  async handleFileStaging(): Promise<boolean> {
    const modifiedFiles = await this.gitService.getAllModifiedFiles();
    const unstagedFiles = modifiedFiles.filter((f) => !f.staged);
    const stagedFiles = modifiedFiles.filter((f) => f.staged);

    if (modifiedFiles.length === 0) {
      console.log(
        chalk.yellow("No files to commit. Please add or modify files first.")
      );
      return false;
    }

    // If all files are already staged, no need to ask
    if (unstagedFiles.length === 0) {
      return true;
    }

    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: "list",
        name: "action",
        message: `You have ${unstagedFiles.length} unstaged file(s)${
          stagedFiles.length > 0
            ? ` and ${stagedFiles.length} staged file(s)`
            : ""
        }. What would you like to do?`,
        choices: [
          ...(stagedFiles.length > 0
            ? [
                {
                  name: `Proceed with ${stagedFiles.length} staged file(s) only`,
                  value: "proceed",
                },
              ]
            : []),
          { name: "Select files to stage/unstage", value: "select" },
          { name: "Stage all files", value: "all" },
          { name: "Cancel", value: "cancel" },
        ],
      },
    ]);

    if (action === "cancel") return false;
    if (action === "proceed") return true;
    if (action === "all") {
      await this.gitService.stageAllFiles();
      console.log(chalk.green("✅ All files have been staged"));
      return true;
    }

    const { selectedFiles } = await inquirer.prompt<{
      selectedFiles: string[];
    }>([
      {
        type: "checkbox",
        name: "selectedFiles",
        message: "Select files to stage (already staged files are checked):",
        choices: modifiedFiles.map((file) => ({
          name: `${file.file}${file.staged ? " (staged)" : ""}`,
          value: file.file,
          checked: file.staged,
        })),
      },
    ]);

    // Get the files that changed their staging status
    const filesToStage = selectedFiles.filter(
      (file) => !stagedFiles.find((f) => f.file === file)
    );
    const filesToUnstage = stagedFiles
      .filter((f) => !selectedFiles.includes(f.file))
      .map((f) => f.file);

    if (filesToStage.length === 0 && filesToUnstage.length === 0) {
      console.log(chalk.yellow("No changes to staging area."));
      return stagedFiles.length > 0;
    }

    // Stage new files
    if (filesToStage.length > 0) {
      await this.gitService.stageFiles(filesToStage);
      console.log(chalk.green(`✅ Staged ${filesToStage.length} file(s)`));
    }

    // Unstage files that were unchecked
    if (filesToUnstage.length > 0) {
      await this.gitService.unstageFiles(filesToUnstage);
      console.log(chalk.yellow(`⚠️ Unstaged ${filesToUnstage.length} file(s)`));
    }

    const finalStagedCount = selectedFiles.length;
    return finalStagedCount > 0;
  }

  async promptForBranchCreation(currentBranch: string): Promise<boolean> {
    const isOnMainBranch = MAIN_BRANCHES.includes(currentBranch);
    const branchPrefixes = BRANCH_TYPES.map((type) => type.value);
    const isOnFeatureBranch = branchPrefixes.some(
      (prefix) =>
        currentBranch.startsWith(prefix + "/") ||
        currentBranch.startsWith(prefix + "-")
    );

    // If we're on a feature branch, no need to create a new one
    if (isOnFeatureBranch) {
      return false;
    }

    if (isOnMainBranch) {
      console.log(
        chalk.yellow(`⚠️  You are currently on ${currentBranch} branch.`)
      );
      console.log(
        chalk.yellow(
          "It is recommended to create a new branch for your changes."
        )
      );

      const { shouldCreateBranch } = await inquirer.prompt<{
        shouldCreateBranch: boolean;
      }>([
        {
          type: "confirm",
          name: "shouldCreateBranch",
          message: "Would you like to create a new branch?",
          default: true,
        },
      ]);

      if (!shouldCreateBranch) {
        const { confirmContinue } = await inquirer.prompt<{
          confirmContinue: boolean;
        }>([
          {
            type: "confirm",
            name: "confirmContinue",
            message: chalk.red(
              `Are you sure you want to commit directly to ${currentBranch}?`
            ),
            default: false,
          },
        ]);

        if (!confirmContinue) {
          console.log(chalk.blue("Operation cancelled"));
          process.exit(0);
        }
      }

      return shouldCreateBranch;
    }

    const { shouldCreateBranch } = await inquirer.prompt<{
      shouldCreateBranch: boolean;
    }>([
      {
        type: "confirm",
        name: "shouldCreateBranch",
        message: "Would you like to create a new branch?",
        default: false,
      },
    ]);

    return shouldCreateBranch;
  }

  async promptForCommitDetails(detailed: boolean): Promise<CommitAnswers> {
    const baseQuestions = [
      {
        type: "list",
        name: "type",
        message: "Select the type of change:",
        choices: COMMIT_TYPES,
      },
      {
        type: "input",
        name: "description",
        message: "Enter a description:",
        validate: (input: string) =>
          input.length > 0 || "Description is required",
      },
      {
        type: "confirm",
        name: "hasBreaking",
        message: "Does this change contain breaking changes?",
        default: false,
      },
    ] as const;

    const detailedQuestions = [
      {
        type: "input",
        name: "scope",
        message: "Enter a scope (optional):",
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
    ] as const;

    const questions = detailed
      ? [...baseQuestions, ...detailedQuestions]
      : baseQuestions;
    const answers = await inquirer.prompt(questions);
    return answers as CommitAnswers;
  }

  async promptForBranchDetails(): Promise<{
    branchType: string;
    branchName: string;
  }> {
    return inquirer.prompt([
      {
        type: "list",
        name: "branchType",
        message: "Select the type of branch:",
        choices: BRANCH_TYPES,
      },
      {
        type: "input",
        name: "branchName",
        message: "Enter a name for your branch:",
        validate: (input: string) => {
          if (input.length === 0) return "Branch name is required";
          if (!/^[a-zA-Z0-9-_/]+$/.test(input)) {
            return "Branch name can only contain letters, numbers, hyphens, underscores, and forward slashes";
          }
          return true;
        },
      },
    ]);
  }

  async promptForPush(branchName: string): Promise<boolean> {
    const isPublished = await this.gitService.isBranchPublished(branchName);
    const message = isPublished
      ? `Would you like to push your commit to origin/${branchName}?`
      : `This branch is not published yet. Would you like to publish it to origin/${branchName}?`;

    const { shouldPush } = await inquirer.prompt<{ shouldPush: boolean }>([
      {
        type: "confirm",
        name: "shouldPush",
        message,
        default: true,
      },
    ]);

    return shouldPush;
  }
}
