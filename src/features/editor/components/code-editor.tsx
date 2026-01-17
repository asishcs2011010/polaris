import { useEffect, useMemo, useRef, useState } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentWithTab } from "@codemirror/commands";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { SparklesIcon } from "lucide-react";

import { minimap } from "../extensions/minimap";
import { customTheme } from "../extensions/theme";
import { getLanguageExtension } from "../extensions/language-extension";
import { customSetup } from "../extensions/custom-setup";
import { suggestion, setSuggestionEffect } from "../extensions/suggestion";
import { quickEdit } from "../extensions/quick-edit";
import {
  getSuggestionsEnabled,
  setSuggestionsEnabled,
} from "../extensions/suggestion-state";
import { selectionTooltip } from "../extensions/selection-tooltip";

interface Props {
  fileName: string;
  initialValue?: string;
  onChange: (value: string) => void;
}

export const CodeEditor = ({
  fileName,
  initialValue = "",
  onChange,
}: Props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const [aiEnabled, setAiEnabled] = useState(getSuggestionsEnabled());

  const languageExtension = useMemo(
    () => getLanguageExtension(fileName),
    [fileName]
  );

  const toggleAI = () => {
    const next = !aiEnabled;
    setAiEnabled(next);
    setSuggestionsEnabled(next);

    if (!next && viewRef.current) {
      viewRef.current.dispatch({
        effects: setSuggestionEffect.of(null),
      });
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: initialValue,
      parent: editorRef.current,
      extensions: [
        oneDark,
        customTheme,
        customSetup,
        languageExtension,
        suggestion(fileName),
        quickEdit(fileName),
        selectionTooltip(),
        keymap.of([indentWithTab]),
        minimap(),
        indentationMarkers(),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            onChange(u.state.doc.toString());
          }
        }),
      ],
    });

    viewRef.current = view;
    return () => view.destroy();
  }, [languageExtension]);

  return (
    <div className="size-full relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={toggleAI}
          className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm bg-background"
        >
          <SparklesIcon
            className={`h-4 w-4 ${
              aiEnabled ? "text-yellow-400" : "text-gray-400"
            }`}
          />
          AI {aiEnabled ? "On" : "Off"}
        </button>
      </div>

      <div ref={editorRef} className="size-full pl-4 bg-background" />
    </div>
  );
};
