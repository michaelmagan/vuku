import simpleGit, { SimpleGit } from "simple-git";
import chalk from "chalk";

export class GitService {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const status = await this.git.status();
      return status.current ?? "";
    } catch (error) {
      console.error(
        chalk.red("Error getting current branch:"),
        (error as Error).message
      );
      process.exit(1);
    }
  }

  async getUnstagedFiles(): Promise<string[]> {
    const status = await this.git.status();
    return [...status.not_added, ...status.modified, ...status.deleted];
  }

  async getStagedFiles(): Promise<string[]> {
    const status = await this.git.status();
    return [...status.staged, ...status.created];
  }

  async getAllModifiedFiles(): Promise<{ file: string; staged: boolean }[]> {
    const status = await this.git.status();
    const stagedFiles = new Set([...status.staged, ...status.created]);
    const modifiedStaged = new Set(
      status.modified.filter((file) => status.staged.includes(file))
    );

    const allFiles = [
      ...status.not_added,
      ...status.modified,
      ...status.deleted,
      ...stagedFiles,
    ];

    // Remove duplicates and track staging status
    const uniqueFiles = [...new Set(allFiles)].map((file) => ({
      file,
      staged: stagedFiles.has(file) || modifiedStaged.has(file),
    }));

    return uniqueFiles;
  }

  async stageFiles(files: string[]): Promise<void> {
    for (const file of files) {
      await this.git.add(file);
    }
  }

  async unstageFiles(files: string[]): Promise<void> {
    for (const file of files) {
      await this.git.raw(["reset", "HEAD", file]);
    }
  }

  async stageAllFiles(): Promise<void> {
    await this.git.add(".");
  }

  async createBranch(branchName: string): Promise<void> {
    try {
      await this.git.checkoutLocalBranch(branchName);
      console.log(
        chalk.green(`✅ Created and switched to branch ${branchName}`)
      );
    } catch (error) {
      console.error(
        chalk.red("Error creating branch:"),
        (error as Error).message
      );
      process.exit(1);
    }
  }

  async commit(message: string): Promise<void> {
    try {
      await this.git.commit(message);
      console.log(chalk.green("✅ Successfully created commit"));
    } catch (error) {
      console.error(
        chalk.red("Error creating commit:"),
        (error as Error).message
      );
      process.exit(1);
    }
  }

  async isBranchPublished(branchName: string): Promise<boolean> {
    try {
      const result = await this.git.raw([
        "ls-remote",
        "--heads",
        "origin",
        branchName,
      ]);
      return result.length > 0;
    } catch (error) {
      console.error(
        chalk.red("Error checking branch status:"),
        (error as Error).message
      );
      return false;
    }
  }

  async push(branchName: string, isPublished: boolean): Promise<void> {
    try {
      if (isPublished) {
        await this.git.push("origin", branchName);
      } else {
        await this.git.push(["-u", "origin", branchName]);
      }
      console.log(
        chalk.green(`✅ Successfully pushed to origin/${branchName}`)
      );
    } catch (error) {
      console.error(
        chalk.red("Error pushing to remote:"),
        (error as Error).message
      );
      process.exit(1);
    }
  }
}
