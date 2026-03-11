"use client";

import type { ReactNode } from "react";
import { Loader2, FilePlus, FilePen, FileSearch, FileX, FolderInput } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  isPending: boolean;
}

function getFileName(path: unknown): string | null {
  if (typeof path !== "string") return null;
  return path.split("/").pop() ?? null;
}

function getLabel(toolName: string, args: Record<string, unknown>): { icon: ReactNode; text: string } {
  const fileName = getFileName(args.path);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return {
          icon: <FilePlus className="w-3 h-3" />,
          text: fileName ? `Creating ${fileName}` : "Creating file",
        };
      case "str_replace":
      case "insert":
        return {
          icon: <FilePen className="w-3 h-3" />,
          text: fileName ? `Editing ${fileName}` : "Editing file",
        };
      case "view":
        return {
          icon: <FileSearch className="w-3 h-3" />,
          text: fileName ? `Reading ${fileName}` : "Reading file",
        };
      default:
        return {
          icon: <FilePen className="w-3 h-3" />,
          text: fileName ? `Editing ${fileName}` : "Editing file",
        };
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const newFileName = getFileName(args.new_path);
        return {
          icon: <FolderInput className="w-3 h-3" />,
          text: fileName && newFileName ? `Renaming ${fileName} to ${newFileName}` : "Renaming file",
        };
      }
      case "delete":
        return {
          icon: <FileX className="w-3 h-3" />,
          text: fileName ? `Deleting ${fileName}` : "Deleting file",
        };
    }
  }

  return { icon: null, text: toolName };
}

export function ToolCallBadge({ toolName, args, isPending }: ToolCallBadgeProps) {
  const { icon, text } = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      )}
      <span className="text-neutral-600 flex-shrink-0">{icon}</span>
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
