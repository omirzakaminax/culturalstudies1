// Bundles src/ into one self-contained docs/index.html (served by GitHub Pages)
const fs=require('fs'),path=require('path');
const src=path.join(__dirname,'src');const out=path.join(__dirname,'docs');fs.mkdirSync(out,{recursive:true});
const data=fs.readdirSync(src).filter(f=>/^d\d.*\.js$/.test(f)).sort();
const app=fs.readdirSync(src).filter(f=>/^a\d.*\.js$/.test(f)).sort();
const js=['var KB={weeks:[]};'].concat(data.concat(app).map(f=>`/* ---- ${f} ---- */\n`+fs.readFileSync(path.join(src,f),'utf8'))).join('\n;\n');
const css=fs.readFileSync(path.join(src,'style.css'),'utf8');
const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cultural Studies – Learning & Exam Platform</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
<noscript>This learning platform needs JavaScript.</noscript>
<script>
${js.replace(/<\/script/gi,'<\\/script')}
</script>
</body>
</html>`;
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('docs/index.html',(html.length/1024).toFixed(0)+' KB');
