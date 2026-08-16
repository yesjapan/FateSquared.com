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
