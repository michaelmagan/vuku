export interface CommitType {
  name: string;
  value: string;
}

export interface CommitAnswers {
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

export interface EmojiMap {
  [key: string]: string;
}

export interface ProgramOptions {
  skipEmoji: boolean;
  detailed: boolean;
}
