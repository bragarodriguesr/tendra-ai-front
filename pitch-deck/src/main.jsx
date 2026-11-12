import React from "react";
import { createRoot } from "react-dom/client";
import { Deck } from "./Deck.jsx";
import { SLIDES } from "./slides.jsx";
import "./deck.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Deck slides={SLIDES} />
  </React.StrictMode>
);
