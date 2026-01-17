import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  keymap,
} from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";

import { fetcher } from "./fetcher";
import { getSuggestionsEnabled } from "../suggestion-state";

/** ✅ EXPORT this so CodeEditor can clear ghost text */
export const setSuggestionEffect = StateEffect.define<string | null>();

const suggestionState = StateField.define<string | null>({
  create() {
    return null;
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setSuggestionEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});

class SuggestionWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.textContent = this.text;
    span.style.opacity = "0.4";
    span.style.pointerEvents = "none";
    return span;
  }
}

let debounceTimer: number | null = null;
let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 150;
let currentAbortController: AbortController | null = null;

const generatePayload = (view: EditorView, fileName: string) => {
  const code = view.state.doc.toString();
  if (!code.trim()) return null;

  const cursor = view.state.selection.main.head;
  const line = view.state.doc.lineAt(cursor);
  const cursorInLine = cursor - line.from;

  const prev: string[] = [];
  for (let i = Math.min(5, line.number - 1); i >= 1; i--) {
    prev.push(view.state.doc.line(line.number - i).text);
  }

  const next: string[] = [];
  for (let i = 1; i <= Math.min(5, view.state.doc.lines - line.number); i++) {
    next.push(view.state.doc.line(line.number + i).text);
  }

  return {
    fileName,
    code,
    currentLine: line.text,
    previousLines: prev.join("\n"),
    textBeforeCursor: line.text.slice(0, cursorInLine),
    textAfterCursor: line.text.slice(cursorInLine),
    nextLines: next.join("\n"),
    lineNumber: line.number,
  };
};

const createDebouncePlugin = (fileName: string) =>
  ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        this.trigger(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) {
          this.trigger(update.view);
        }
      }

      trigger(view: EditorView) {
        if (!getSuggestionsEnabled()) {
            debounceTimer && clearTimeout(debounceTimer);
            debounceTimer = null;

            currentAbortController?.abort();
            currentAbortController = null;

            isWaitingForSuggestion = false;

            // ✅ defer dispatch to avoid update-in-progress crash
            queueMicrotask(() => {
              view.dispatch({
                effects: setSuggestionEffect.of(null),
              });
            });

            return;
          }

        debounceTimer && clearTimeout(debounceTimer);
        currentAbortController?.abort();

        isWaitingForSuggestion = true;

        debounceTimer = window.setTimeout(async () => {
          const payload = generatePayload(view, fileName);
          if (!payload) {
            isWaitingForSuggestion = false;
            view.dispatch({ effects: setSuggestionEffect.of(null) });
            return;
          }

          currentAbortController = new AbortController();
          const suggestion = await fetcher(payload, currentAbortController.signal);

          isWaitingForSuggestion = false;
          view.dispatch({ effects: setSuggestionEffect.of(suggestion) });
        }, DEBOUNCE_DELAY);
      }

      destroy() {
        debounceTimer && clearTimeout(debounceTimer);
        currentAbortController?.abort();
      }
    }
  );

const renderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.transactions.some((t) =>
          t.effects.some((e) => e.is(setSuggestionEffect))
        )
      ) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView) {
      if (!getSuggestionsEnabled() || isWaitingForSuggestion) {
        return Decoration.none;
      }

      const suggestion = view.state.field(suggestionState);
      if (!suggestion) return Decoration.none;

      const cursor = view.state.selection.main.head;
      return Decoration.set([
        Decoration.widget({
          widget: new SuggestionWidget(suggestion),
          side: 1,
        }).range(cursor),
      ]);
    }
  },
  { decorations: (v) => v.decorations }
);

const acceptSuggestionKeymap = keymap.of([
  {
    key: "Tab",
    run(view) {
      const suggestion = view.state.field(suggestionState);
      if (!suggestion) return false;

      const cursor = view.state.selection.main.head;
      view.dispatch({
        changes: { from: cursor, insert: suggestion },
        selection: { anchor: cursor + suggestion.length },
        effects: setSuggestionEffect.of(null),
      });
      return true;
    },
  },
]);

export const suggestion = (fileName: string) => [
  suggestionState,
  createDebouncePlugin(fileName),
  renderPlugin,
  acceptSuggestionKeymap,
];
