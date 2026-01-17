// suggestion-state.ts

let suggestionsEnabled = true;

export const getSuggestionsEnabled = () => suggestionsEnabled;

export const setSuggestionsEnabled = (enabled: boolean) => {
  suggestionsEnabled = enabled;
};