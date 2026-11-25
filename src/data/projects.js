// Edit this list to change what shows up in the Portfolio view.
//
// Fields: title, description, tags[], icon (Font Awesome class), live (URL),
//         repo (URL), image ("assets/images/<file>" inside /public, optional),
//         to ("/route": makes the whole card a link), cta (text for that link),
//         href (external URL: makes the whole card a link that opens in a new tab)
//
// Everything except the first entry is placeholder content: replace it.
export const PROJECTS = [
  {
    title: "This site",
    description:
      "A glassmorphic bio page with live Discord presence, persistent background music and animated view transitions.",
    tags: ["React", "Vite", "Framer Motion"],
    icon: "fa-solid fa-wand-magic-sparkles",
    live: null,
    repo: null,
  },
  {
    title: "SolidWorks Projects",
    description:
      "Interactive 3D models of my CAD parts. Rotate, zoom and switch between them.",
    tags: ["SolidWorks", "CAD", "3D"],
    icon: "fa-solid fa-cube",
    to: "/portfolio/solidworks",
    cta: "Open 3D viewer",
  },
  {
    title: "AutoDraw 2D: 3D CAD to 2D drawing",
    description:
      "Converts 3D CAD .STEP files into annotated 2D engineering drawings with AI auto-dimensioning and DXF export.",
    tags: ["Python", "React", "Gemini AI"],
    icon: "fa-solid fa-code",
    href: "https://autodraw.nutdope.xyz",
    cta: "Launch App",
  },
  {
    title: "Project title",
    description: "One or two sentences on what it does and what you built.",
    tags: ["Tag", "Tag"],
    icon: "fa-solid fa-palette",
  },
  {
    title: "Project title",
    description: "One or two sentences on what it does and what you built.",
    tags: ["Tag", "Tag"],
    icon: "fa-solid fa-terminal",
  },
  {
    title: "Project title",
    description: "One or two sentences on what it does and what you built.",
    tags: ["Tag", "Tag"],
    icon: "fa-solid fa-cube",
  },
];
