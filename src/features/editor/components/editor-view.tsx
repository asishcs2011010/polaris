import Image from "next/image";
import { useEffect, useRef } from "react";

import { useFile, useUpdateFile } from "@/features/projects/hooks/use-files";

import { CodeEditor } from "./code-editor";
import { useEditor } from "../hooks/use-editor";
import { TopNavigation } from "./top-navigation";
import { FileBreadcrumbs } from "./file-breadcrumbs";
import { Id } from "../../../../convex/_generated/dataModel";

const DEBOUNCE_MS = 1500;

export const EditorView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const { activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId);
  const updateFile = useUpdateFile();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<{ id: Id<"files">; content: string } | null>(null);

  const isActiveFileBinary = activeFile && activeFile.storageId;
  const isActiveFileText = activeFile && !activeFile.storageId;

  // Cleanup pending debounced updates on unmount or file change
 useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Flush any pending update before tab switch/unmount
    if (pendingUpdateRef.current) {
      updateFile(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }
  };
}, [activeTabId, updateFile]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center">
        <TopNavigation projectId={projectId} />
      </div>
      {activeTabId && <FileBreadcrumbs projectId={projectId} />}
      <div className="flex-1 min-h-0 bg-background">
        {!activeFile && (
          <div className="size-full flex items-center justify-center">
            <Image
              src="/logo-alt.svg"
              alt="Polaris"
              width={50}
              height={50}
              className="opacity-25"
            />
          </div>
        )}
        {isActiveFileText && (
          <CodeEditor
            key={activeFile._id}
            fileName={activeFile.name}
            initialValue={activeFile.content ?? ""}
            onChange={(content: string) => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }

              // Track pending update
              pendingUpdateRef.current = { id: activeFile._id, content };

              timeoutRef.current = setTimeout(() => {
                updateFile({ id: activeFile._id, content });
                pendingUpdateRef.current = null; // clear after successful flush
              }, DEBOUNCE_MS);
            }}
          />
        )}
        {isActiveFileBinary && (
          <p>TODO: Implement binary preview</p>
        )}
      </div>
    </div>
  );
};