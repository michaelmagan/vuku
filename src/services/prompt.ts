import inquirer, { QuestionCollection } from "inquirer";
import chalk from "chalk";
import { CommitAnswers } from "../types";
import { BRANCH_TYPES, COMMIT_TYPES, MAIN_BRANCHES } from "../constants";
import { GitService } from "./git";

export class PromptService {
  constructor(private gitService: GitService) {}

  async handleFileStaging(): Promise<boolean> {
    const unstagedFiles = await this.gitService.getUnstagedFiles();
    const stagedFiles = await this.gitService.getStagedFiles();

    if (unstagedFiles.length === 0) {
      if (stagedFiles.length === 0) {
        console.log(
          chalk.yellow("No files to commit. Please add or modify files first.")
        );
        return false;
      }
      return true;
    }

    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: "list",
        name: "action",
        message: "You have unstaged files. What would you like to do?",
        choices: [
          { name: "Select individual files to stage", value: "select" },
          { name: "Stage all files", value: "all" },
          { name: "Cancel", value: "cancel" },
        ],
      },
    ]);

    if (action === "cancel") return false;
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
        message: "Select files to stage:",
        choices: unstagedFiles.map((file) => ({
          name: file,
          value: file,
        })),
      },
    ]);

    if (selectedFiles.length === 0) {
      console.log(chalk.yellow("No files selected. Operation cancelled."));
      return false;
    }

    await this.gitService.stageFiles(selectedFiles);
    console.log(chalk.green(`✅ Staged ${selectedFiles.length} file(s)`));
    return true;
  }

  async promptForBranchCreation(currentBranch: string): Promise<boolean> {
    const isOnMainBranch = MAIN_BRANCHES.includes(currentBranch);

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
    const { shouldPush } = await inquirer.prompt<{ shouldPush: boolean }>([
      {
        type: "confirm",
        name: "shouldPush",
        message: `Would you like to push your changes to origin/${branchName}?`,
        default: true,
      },
    ]);

    return shouldPush;
  }
}
