#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { GitService } from "./services/git";
import { PromptService } from "./services/prompt";
import { FormatterService } from "./services/formatter";

const program = new Command();

program
  .name("vuku")
  .description(
    "Interactive git branch and commit message generator following conventional commits"
  )
  .version("1.1.0")
  .option("-s, --skip-emoji", "Skip adding emojis to commit messages")
  .option("-d, --detailed", "Show additional optional fields during commit")
  .addHelpText(
    "after",
    `
Example usage:
  $ vuku
  $ vuku --skip-emoji
  $ vuku --detailed

The tool will guide you through:
1. Creating a new branch (optional)
2. Creating a conventional commit message with:
   - Type of change (feat, fix, docs, etc.)
   - Description
   - Breaking changes indicator
   ${chalk.gray("When using --detailed flag:")}
   ${chalk.gray("   - Scope (optional)")}
   ${chalk.gray("   - Extended description (optional)")}
   ${chalk.gray("   - Footer notes (optional)")}`
  )
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    const gitService = new GitService();
    const promptService = new PromptService(gitService);
    const formatterService = new FormatterService(options.skipEmoji);

    const currentBranch = await gitService.getCurrentBranch();
    const shouldCreateBranch = await promptService.promptForBranchCreation(
      currentBranch
    );

    if (shouldCreateBranch) {
      const { branchType, branchName } =
        await promptService.promptForBranchDetails();
      const formattedBranchName = formatterService.formatBranchName(
        branchType,
        branchName
      );
      await gitService.createBranch(formattedBranchName);
    }

    const filesStaged = await promptService.handleFileStaging();
    if (!filesStaged) {
      process.exit(0);
    }

    const commitAnswers = await promptService.promptForCommitDetails(
      options.detailed
    );
    const commitMessage = formatterService.formatCommitMessage(commitAnswers);
    await gitService.commit(commitMessage);
  } catch (error) {
    console.error(chalk.red("An error occurred:"), (error as Error).message);
    process.exit(1);
  }
}

main();
