const fs = require("fs")
const path = require("path")

const distDir = path.join(process.cwd(), "dist")
const assets = ["index.html", "styles.css", "script.js", "content.md"]
const folders = ["images"]

const copyFile = (file) => {
  fs.copyFileSync(path.join(process.cwd(), file), path.join(distDir, file))
}

const copyFolder = (folder) => {
  const srcDir = path.join(process.cwd(), folder)
  const destDir = path.join(distDir, folder)
  fs.mkdirSync(destDir, { recursive: true })
  for (const entry of fs.readdirSync(srcDir)) {
    const srcEntry = path.join(srcDir, entry)
    const destEntry = path.join(destDir, entry)
    const stat = fs.statSync(srcEntry)
    if (stat.isDirectory()) {
      copyFolder(path.join(folder, entry))
    } else {
      fs.copyFileSync(srcEntry, destEntry)
    }
  }
}

fs.rmSync(distDir, { recursive: true, force: true })
fs.mkdirSync(distDir, { recursive: true })

assets.forEach(copyFile)
folders.forEach((folder) => {
  const absolute = path.join(process.cwd(), folder)
  if (fs.existsSync(absolute)) {
    copyFolder(folder)
  }
})

console.log("Static assets prepared in dist/")
