import React, { forwardRef } from "react";
import "./tendra-logo-element.js";

// Logo animado ("Horas, não semanas"): wrapper React do custom element <tendra-logo>.
// `class` (não className): no React 18 custom elements recebem atributos crus.
// O ref aponta para o elemento — expõe play(), pause(), replay() e currentTime.
export const AnimatedLogo = forwardRef(function AnimatedLogo(
  { variant = "ink", once = false, paused = false, bare = false, title = "Tendra.ai", className, style, ...rest },
  ref
) {
  return (
    <tendra-logo
      ref={ref}
      variant={variant}
      once={once ? "" : undefined}
      paused={paused ? "" : undefined}
      bare={bare ? "" : undefined}
      aria-label={title}
      class={className}
      style={style}
      {...rest}
    />
  );
});
