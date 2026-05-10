const productChromeLabelClassName = "font-ui-condensed text-xs font-semibold uppercase tracking-[0.01em]";

export function getToolbarLabelClassName(textClassName = "") {
  return [productChromeLabelClassName, textClassName].filter(Boolean).join(" ");
}

export const getPanelEyebrowClassName = getToolbarLabelClassName;
