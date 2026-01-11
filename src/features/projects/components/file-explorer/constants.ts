
// Base Padding for root level
export const BASE_PADDING = 12;
// Additional Padding per nesting level
export const LEVEL_PADDING = 12;

export const getItemPadding = (level: number, isFile: boolean) => {
    const fileOffset = isFile ? 16 : 0;
    return BASE_PADDING + level * LEVEL_PADDING + fileOffset;
}
