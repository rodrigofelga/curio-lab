# CurioLab — Interactive Educational Hub

Public, accessible, responsive educational landing page.

## Deployment repository

- Repository: https://github.com/rodrigofelga/curio-lab
- Live site after GitHub Pages is enabled: https://rodrigofelga.github.io/curio-lab/
- Hosting: free GitHub Pages (`main` branch, `/(root)`)

## Live educational experiences

| Experience | Live website | GitHub source |
|---|---|---|
| Animal Cell Explorer | https://rodrigofelga.github.io/animal-cell-explorer/ | https://github.com/rodrigofelga/animal-cell-explorer |
| Solar System and Milky Way Explorer | https://rodrigofelga.github.io/solar-system-galaxy/ | https://github.com/rodrigofelga/solar-system-galaxy |

Physics, Earth & Nature, Chemistry, and Mathematics cards are visibly labeled **Coming soon**.

## Deploy from Windows PowerShell

Clone the **existing, empty** repository first:

```powershell
cd "C:\Users\Admin\Documents\GitHub"
git clone https://github.com/rodrigofelga/curio-lab.git
cd "curio-lab"
```

Extract the **contents** of the ZIP archive into this folder, so `index.html`, `styles.css`, `script.js`, `README.md`, `.nojekyll` and `assets/` are in its root, not nested under another directory.

```powershell
git status
git add .
git commit -m "Launch CurioLab educational hub"
git branch -M main
git push -u origin main
```

In GitHub, go to **Settings → Pages** and choose **Deploy from a branch**, branch **main**, folder **/(root)** and click **Save**. Site URL is `https://rodrigofelga.github.io/curio-lab/` once published.

## Run locally

Open `index.html` in Chrome, Edge, or Firefox. No package manager or build step is required.

## Files

- `index.html`: content and experience links
- `styles.css`: responsive layout, colours and design
- `script.js`: navigation, interactive filters and search
- `assets/`: original SVG artwork and favicon
- `.nojekyll`: serve static files directly in GitHub Pages

## Maintain and update

After editing files:

```powershell
git add .
git commit -m "Update CurioLab landing page"
git push
```

Educational experiences are third-party pages relative to this site; the content behind those links can change independently. Site illustrations are stylized educational artwork. Project created by Rodrigo Felga de Castro.
