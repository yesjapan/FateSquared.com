# Assets

The site references these by exact filename and quietly falls back (CSS-drawn cover,
initials block, hidden section) if one is missing.

| File | Status | Notes |
|---|---|---|
| `cover-front.jpg` | ✅ in place | From `Graphics/fate squared front cover.png` (1030×1593), exported as JPG. |
| `cover-back.jpg` | ✅ in place | From `Graphics/fate squared back cover.png`. Shown when the visitor taps the book. |
| `spine.jpg` | ✅ in place | The 220×1606 spine strip cropped from `Graphics/fate squared FULL SPREAD.png` (x 1024–1244). Drives the 3D book's spine; its 220:1030 width ratio also sets the book's thickness in CSS (`.book { --book-thick }`). |
| `author.jpg` | ✅ in place | 1000×1250 (4:5), cropped from `Graphics/author.png` (3840×2160). Crop region located by template-matching the back-cover portrait against the 4K frame, then widened to 4:5. |
| `og.jpg` | ✅ generated | 1200×630 social-share image: front cover over a blurred full spread. Regenerate any time with the ffmpeg command below. |
| `chapter-1.mp3` | optional | If present, the **Listen** section and nav link appear automatically. |
| `FateSquared-Bold.woff2` / `.ttf` | ✅ in use | The cover's display face, Bold cut — drives the hero FATE / SQUARED lockup. WOFF2 (19.1 KB) is served; the TTF is the fallback for browsers without WOFF2. |
| `FateSquared-Regular.woff2` / `.ttf` | declared, unused | The Regular cut, declared at `font-weight: 400` under the same `FateSquared` family. Nothing currently uses it, so it is never downloaded — switch `.hero__title { font-weight }` to 400 to try it. |
| `favicon.svg` | ✅ in place | Tab icon. Replace if you like. |

Regenerate `og.jpg` from the source graphics:

```
ffmpeg -y -i "fate squared FULL SPREAD.png" -i "fate squared front cover.png" \
  -filter_complex "[0]scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630,gblur=sigma=22,eq=brightness=-0.12:saturation=1.15[bg];[1]scale=-1:570[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" \
  -q:v 3 og.jpg
```

Regenerate `author.jpg` from the 4K original:

```
ffmpeg -y -i author.png -vf "crop=1443:1804:1287:200,scale=1000:1250:flags=lanczos" -q:v 3 author.jpg
```

Regenerate `spine.jpg` (if the spread changes, re-measure where the back cover ends / front begins):

```
ffmpeg -y -i "fate squared FULL SPREAD.png" -vf "crop=220:1606:1024:0" -q:v 2 spine.jpg
```

Source graphics live at `G:\My Drive\File Cabinet\Novels\Fate Squared\Graphics`.

## Hero title weight

The hero lockup uses the **Bold** cut as drawn. Both knobs live on
`.hero__title` in `styles.css`:

```css
--title-boost:   0;                    /* synthetic extra weight; 0 = as drawn */
--title-outline: max(2.5px, 0.019em);  /* hollow magenta stroke on SQUARED */
```

Measured stem-to-cap-height ratios, for reference when tuning:

| | stem/cap | width/cap |
|---|---|---|
| printed cover "FATE" | 0.160 | 2.42 |
| **FateSquared Bold (in use)** | **0.374** | **2.01** |
| FateSquared Regular | 0.309 | 1.74 |
| Big Shoulders 900 (previous) | 0.421 | 1.97 |

Bold sits within ~11% of the weight it replaced and has practically the same
footprint. Set `--title-boost: 0.06em` to match the old weight exactly; past
roughly `0.08em` the stroke starts rounding corners and closing counters.

Regenerate the WOFF2 files after replacing a TTF:

```
python -m pip install "fonttools[woff]" brotli
python -c "from fontTools.ttLib import TTFont; f=TTFont('FateSquared-Bold.ttf'); f.flavor='woff2'; f.save('FateSquared-Bold.woff2')"
```
