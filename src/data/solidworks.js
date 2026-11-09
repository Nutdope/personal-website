import { asset } from "../config";

// The parts shown in the SolidWorks viewer. Edit this list to add your own.
//
// Fields:
//   id, name, description, icon (Font Awesome class), color (metal tint),
//   tags[], specs [[label, value], ...], source, rotation (optional)
//
// source is one of:
//   { type: "stl", url: asset("assets/models/my-part.stl") }   <- SolidWorks: Save As > STL
//   { type: "glb", url: asset("assets/models/my-part.glb") }   <- keeps its own colors/materials
//   { type: "procedural", builder: "gear" | "flange" | "bracket" }   <- built-in placeholders
//
// Put your files in public/assets/models/.
// rotation: [xDeg, yDeg, zDeg], only for stl/glb. If your part loads lying on its
// side, use [-90, 0, 0] (many CAD exports are Z-up, three.js is Y-up).
//
// Everything below is placeholder content: replace it with your real parts.
export const SW_MODELS = [
  {
    id: "gear",
    name: "Spur Gear",
    description:
      "18-tooth spur gear with a hub and five lightening holes. Placeholder part: swap it for your own model.",
    icon: "fa-solid fa-gear",
    color: "#c4b5fd",
    tags: ["Part", "Gear"],
    specs: [
      ["Teeth", "18"],
      ["Material", "Steel (placeholder)"],
      ["Software", "SolidWorks"],
    ],
    source: { type: "procedural", builder: "gear" },
  },
  {
    id: "flange",
    name: "Pipe Flange",
    description:
      "Six-bolt flange with a raised neck. Placeholder part: swap it for your own model.",
    icon: "fa-solid fa-circle-dot",
    color: "#d4d4d8",
    tags: ["Part", "Piping"],
    specs: [
      ["Bolt holes", "6"],
      ["Material", "Stainless steel (placeholder)"],
      ["Software", "SolidWorks"],
    ],
    source: { type: "procedural", builder: "flange" },
  },
  {
    id: "bracket",
    name: "Angle Bracket",
    description:
      "L-shaped mounting bracket with four base holes and two wall holes. Placeholder part: swap it for your own model.",
    icon: "fa-solid fa-ruler-combined",
    color: "#a5b4fc",
    tags: ["Part", "Sheet metal"],
    specs: [
      ["Thickness", "2 mm (placeholder)"],
      ["Material", "Aluminium (placeholder)"],
      ["Software", "SolidWorks"],
    ],
    source: { type: "procedural", builder: "bracket" },
  },

  {
  id: "arbore",
  name: "Arbore",
  description: "Mechanical shaft, 105 mm long.",
  icon: "fa-solid fa-gears",
  color: "#c4b5fd",
  tags: ["Part", "Shaft"],
  specs: [
    ["Length", "105 mm"],
    ["Max diameter", "28 mm"],
    ["Software", "SolidWorks"],
  ],
  source: { type: "stl", url: asset("assets/models/arbore.STL") },
},
];