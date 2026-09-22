# Kzoom

Kzoom is a spatial presentation prototype. Ideas live on one canvas; a camera travels between named frames to tell the story. The first launch opens a two frame technology startup demo.

> Screenshots: add editor and presentation mode images here after the first release.

## Features in this MVP

- Infinite canvas with pointer drag and cursor centered wheel zoom
- Rotatable camera with frame focus and animated transitions
- Presentation mode with fullscreen when available, keyboard and on screen navigation
- Local autosave for the document title and JSON import/export
- PDF download with one page per presentation step, including text, images, and clickable YouTube links
- PDF and PowerPoint `.pptx` import from the File menu, creating one slide per page or source slide
- Nested slides that open as separate full-size pages, each with its own visual style and content
- Eleven visual image paths: timeline arrow, circle, four column mosaic, spiral, zigzag, chevrons, numbered medallions, vertical steps, ribbons, milestones, and color spectrum
- JPG, PNG, and WebP image upload with local resizing and a camera frame for each image
- YouTube links as video steps, playable inside the canvas in editor and presentation mode
- Responsive editor and reduced motion support
- Light, dark, deep black, and sapphire blue appearance modes, saved per browser

The original startup demo remains available as the Classic style. Visual styles can be selected from **Styles**; their sample illustrations can be replaced with personal images from **Images**. Use the video button to add a YouTube URL as another step. Images and video IDs are stored in this browser as part of the presentation JSON, subject to browser storage limits. The YouTube player loads only when clicked and uses YouTube's privacy enhanced embed domain. Export JSON to keep a portable backup. Frame creation, path reordering, undo/redo, and collaboration are planned work.

Use **File → Importer PDF / PowerPoint** to turn a PDF or `.pptx` into a new presentation. Each source page or slide becomes a visual slide in the canvas. Import runs in the browser and replaces the current presentation; export JSON first if you need a backup. Embedded document text is part of the page image, while new Kzoom text blocks remain editable. Files up to 30 MB and 40 pages/slides are accepted when the converted presentation fits local browser storage. Legacy `.ppt` files need to be saved as `.pptx` first.

Double-click a slide number to open its sub-presentation. Before creating the first slide, choose Clair, Aurore, Minuit, or Sable. The sub-presentation opens as a full workspace with its own slides, shared style, timeline, and add-slide button. The back button returns to the parent slide, and PDF export includes nested pages after their parent.

## Stack and decisions

React 19, TypeScript strict, Vite, Zustand, CSS, Lucide icons, and Vitest. The camera uses a CSS transform on one world layer. World coordinates remain independent of the viewport, making zoom around a pointer and frame focus predictable. The document store is separate from the ephemeral camera and presentation state so camera movement never triggers persistence. A small `requestAnimationFrame` transition engine interpolates position, logarithmic zoom, and rotation. No 3D engine or backend is required.

```
src/
  components/canvas/InfiniteCanvas.tsx  Canvas rendering and pointer input
  engine/camera.ts                 Coordinate transforms and frame fitting
  engine/CameraController.ts       Camera commands
  engine/transitions.ts            Animation interpolation
  store/                            Persistent document and transient editor state
  types/presentation.ts             Typed JSON document model
  utils/storage.ts                  Local storage and JSON validation
  data/demo.ts                      Original first launch example
  data/visualStyles.ts              Gallery layouts and sample illustrations
```

## Local development

Requires Node.js 22 or later.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Other scripts:

```bash
npm run test
npm run lint
npm run build
npm run preview
```

The static build is written to `dist/`.

## Controls

Drag the canvas to pan. Use the wheel to zoom toward the cursor; horizontal trackpad scroll or Shift + wheel pans. Click a frame in the sidebar or bottom path to fly there. `0` shows the whole story, `+` and `-` zoom, `P` starts presenting. In presentation mode, use arrow keys or Space to navigate and Escape to exit. The on screen controls also work with touch.

Click the Kzoom logo to hide the top bar, sidebar, and presentation path and expand the canvas. Click the floating Kzoom logo or press Escape to restore the editor panels.

Use **Texte** in the top bar or **Modifier le texte** in the sidebar to rename the active step, add a text block, or edit its font, size, and position. Click an existing text block on the canvas to edit it directly. Changes are saved with the presentation in local storage and included in JSON exports.

To remove a text block or heading, select it on the canvas and use its red trash button, choose **Supprimer ce texte** in the Text panel, or press Delete/Backspace while focus is outside an input. Editing a title or text in the panel updates the canvas immediately.

Drag a text block to place it anywhere on the canvas. Select it and drag the round handle to rotate it, or use the rotation slider in **Texte**. **Titre XXL** creates a large video-style heading with a dark outline. The editor also offers font sizes up to 240 px, colors, and shadow effects.

Use **File → Télécharger PDF** to save the full presentation as a landscape PDF, one step per page. Videos appear as clickable YouTube links. If a remote image cannot be loaded by the browser, the PDF still downloads with a placeholder and reports how many images were unavailable.

Click an image in the editor or during a presentation to move the camera closer. Double click the image to return to the previous camera view; on touch, tap the focused image again. With the keyboard, focus an image and press Enter or Space to zoom, then Backspace to return.

Copy an image from another app and press Ctrl+V while the canvas is active to paste it at the center of the current view. You can also select an image in Kzoom, press Ctrl+C, then Ctrl+V to duplicate it. Supported formats are JPG, PNG, and WebP. Drag an image in edit mode to move it, then drag its round handle to rotate it. These changes are saved locally and included in PDF and JSON exports.

Paste a YouTube watch, share, Shorts, or embed URL through **Ajouter une vidéo**. The new frame appears at the end of the current path, including the Classic story. Select it and press **Lire** on the video card to load the player. Playback is available in both editor and presentation mode; moving to another frame unloads the player. A video must permit embedding on third-party sites to play here.

Use the palette button in the top bar to switch between light, dark, deep black, and sapphire blue. The canvas backdrop uses smooth gradients rather than a zoomed dot texture; Deep Black uses a uniform black backdrop. The preference is local to your browser and is independent of the presentation JSON.

## GitHub Pages

The Vite base path is `./`, so built asset URLs work under `https://username.github.io/repository-name/`. Push this repository to the `main` branch on GitHub, then select **GitHub Actions** as the Pages build and deployment source in repository settings. `.github/workflows/deploy.yml` runs tests, builds the site, and deploys `dist/` after each push. No repository secrets are needed for this static MVP. Any future AI integration must use a secure backend or serverless function, never a frontend API key.

## Roadmap

1. Canvas and camera — MVP complete
2. Element creation, selection, transforms, and history
3. Frame editing and reorderable path
4. More transition styles and presentation controls
5. Stronger document validation and storage adapters
6. Spatial templates
7. Large canvas rendering optimizations
8. Cloud collaboration
9. AI generation through a secure service
10. Optional Three.js modules for true 3D content

## Contributing

Open an issue describing the proposed change, then submit a focused pull request. Run `npm run test`, `npm run lint`, and `npm run build` before submitting.

## License

MIT. See [LICENSE](LICENSE).
