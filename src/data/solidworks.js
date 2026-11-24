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
//   { type: "stl-folder", folder: "arbore" }   <- assembly: every STL in public/assets/models/arbore/
//
// stl-folder names each part from its file name ("Arbore - 6411-1 6411_01-1.STL"
// becomes "6411-1 6411 01"). Optional extras, keyed by file name or that auto name:
//   color: "#b8bcc4"                       one tint for every part
//   names: { "6411-1 6411 01": "Bush" }    rename a part
//   colors: { "6411-1 6411 01": "#f00" }   tint one part
//   exclude: ["Arbore test"]               leave a file out
// For the parts to line up, export the assembly from SolidWorks as STL with
// "Save all components of an assembly in separate files" and
// "Do not translate STL output data to positive space" ticked.
//
// Put your files in public/assets/models/.
// rotation: [xDeg, yDeg, zDeg], only for stl/glb. If your part loads lying on its
// side, use [-90, 0, 0] (many CAD exports are Z-up, three.js is Y-up).
//
// Everything below is placeholder content: replace it with your real parts.
export const SW_MODELS = [
  {
    id: "handle",
    name: "Window Handle",
    description:
      "Modern window handle with a flat, gently curved lever arm, tapered cylindrical hub, and integrated locking latch.",
    icon: "fa-solid fa-gear",
    color: "#c4b5fd",
    tags: ["Part", "Handle"],
    specs: [
      ["Type", "Lever Handle"],
      ["Material", "1023 Carbon Steel Sheet (SS)"],
      ["Software", "SolidWorks"],
    ],
    source: { type: "stl", url: asset("assets/models/window_handle.STL") },
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
  id: "arbore",
  name: "Arbore",
  kind: "assembly",
  description: "Arbore assembly.",
  icon: "fa-solid fa-gears",
  tags: ["Assembly"],
  source: { type: "stl-folder", folder: "arbore", color: "#b8bcc4" },
},
  {
    id: "fidget-spinner",
    name: "Fidget Spinner",
    kind: "assembly",
    description: "Three-lobe fidget spinner assembly with 608-2Z bearings.",
    icon: "fa-solid fa-fan",
    tags: ["Assembly"],
    source: { type: "stl-folder", folder: "fidget_spinner" },
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
  id: "piesa4",
  name: "Piesa4",
  description: "Mechanical shaft, 105 mm long.",
  icon: "fa-solid fa-gears",
  color: "#c4b5fd",
  tags: ["Part", "Shaft"],
  specs: [
    ["Length", "105 mm"],
    ["Max diameter", "28 mm"],
    ["Software", "SolidWorks"],
  ],
  source: { type: "stl", url: asset("assets/models/part4.STL") },
},
];