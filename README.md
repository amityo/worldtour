# WorldTour

An interactive world map that visualizes your travel history year by year. Highlight visited countries and US states, scrub through a timeline, and share a self-hosted page with anyone.

## Features

- **Timeline** — scrub year by year to replay your travel history
- **All-years view** — toggle to see every country you've ever visited at once
- **Country & state support** — tracks both countries (world) and US states
- **Color palettes** — six built-in themes
- **Country labels** — toggleable, scale with zoom
- **Flexible config** — countries accept ISO alpha-3 codes (`"FRA"`) or full English names (`"France"`)

## Installation

**Prerequisites:** Node.js 18+

```bash
git clone <your-repo-url>
cd worldtour
npm install
```

## Configuration

Edit `public/worldtour.config.json` to set your visited places:

```json
{
  "startYear": 2018,
  "endYear": null,
  "visited": {
    "2022": {
      "countries": ["Japan", "KOR", "France"],
      "states": ["California", "New York"]
    },
    "2023": {
      "countries": ["AUS", "New Zealand"],
      "states": []
    }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `startYear` | number | First year shown on the timeline |
| `endYear` | number \| null | Last year on timeline (`null` = current year) |
| `visited` | object | Keys are years; each entry lists `countries` and `states` |

**Countries** accept ISO 3166-1 alpha-3 codes (`"USA"`) or full English names (`"United States"`).  
**States** use full US state names (`"New York"`, `"California"`).

## Development

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build
```

The build step validates your config first — it will error on unrecognised country codes or state names before compiling.

Output goes to `dist/`. Deploy anywhere that serves static files (GitHub Pages, Netlify, Vercel, etc.).

## Preview production build

```bash
npm run preview
```
