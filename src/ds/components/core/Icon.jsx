import React from "react";
import { ICON_PATHS } from "./icon-paths.js";

const SIZES = { sm: 14, md: 16, lg: 20, xl: 24 };

export function Icon({ name, size = "md", color = "currentColor", strokeWidth = 2, style, ...rest }) {
  const px = typeof size === "number" ? size : SIZES[size] || SIZES.md;
  const inner = ICON_PATHS[name];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none", display: "block", ...style }}
      dangerouslySetInnerHTML={{ __html: inner }}
      {...rest}
    />
  );
}
