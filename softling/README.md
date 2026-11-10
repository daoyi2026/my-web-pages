# Softling

A browser-local drawing-to-plush playground with a minimal cream and sage interface.

## Run

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory. Open http://localhost:4173. All dependencies are vendored; no external API is called.

## Behavior

- Draw a silhouette, undo/clear, or start from a cloud. Generate or reroll the companion.
- Open strokes get padded width and enclosed multi-stroke regions fill together. Distant strokes remain separate. No undrawn body anatomy is added.
- Five shuffled materials: short, fluffy, shaggy, curly and whole-body gingham cotton. Velvet and sherpa are removed. Automatic pastel colors and supportive sentences avoid immediate repeats.
- Gingham covers the complete front and back as an independent fabric style. There are no cloth patches on fur. Random visible accessories include buttons, folded woven ribbon bows, hats and flower barrettes.
- Expressions are flat dark embroidery without glass eyes or highlights. The face fits inside the silhouette.
- Export opens a 1080 × 1350 PNG card preview containing the current rotated companion and exact displayed sentence. A download link and long-press image fallback allow saving. Nothing is posted automatically.
- Drawing state stays in memory and resets on reload.

## Verification pages

`materials.html` compares the five profiles and four accessory variants. `checks/linework.html` checks connected and closed shells, finite coordinates, independent open strokes and eight flat expressions. User visual acceptance and real-device touch are separate from these checks.

## Floating decorations and surroundings

Hats float above the complete body/pile envelope. Bows and barrettes sit forward of the full shell and pile, without shaving any accessory region. Each identity includes one independent miniature cane, stacked cushions or potted plant beside the companion. The camera fits these objects and the floating hat into the same export frame.

Hat variants: soft beret, bucket hat and pom-pom cone hat. Cane variants: striped curved handle, star topper and flower topper. Sofa removed at user request.
