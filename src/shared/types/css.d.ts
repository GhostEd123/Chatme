// Lets `import "../global.css"` typecheck. Metro/Uniwind handles the CSS at
// build time; there is no runtime value to import.
declare module "*.css";
