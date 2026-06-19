const fs = require('fs');
let code = fs.readFileSync('d:/work/moive/scripts/ui.js', 'utf8');

code = code.replace(/'#\$\{item\.type \|\| 'movie'\}\/\$\{item\.id\}'/g, "'#${item.type || 'movie'}/${item.id}${item.guessed_season && item.guessed_season > 1 ? '?s=' + item.guessed_season : ''}'");

code = code.replace(/'#\$\{item\.type \|\| 'tv'\}\/\$\{item\.id\}'/g, "'#${item.type || 'tv'}/${item.id}${item.guessed_season && item.guessed_season > 1 ? '?s=' + item.guessed_season : ''}'");

code = code.replace(/"#\$\{item\.type \|\| 'movie'\}\/\$\{item\.id\}"/g, "\"#${item.type || 'movie'}/${item.id}${item.guessed_season && item.guessed_season > 1 ? '?s=' + item.guessed_season : ''}\"");

code = code.replace(/'#\$\{mediaType\}\/\$\{item\.id\}'/g, "'#${mediaType}/${item.id}${item.guessed_season && item.guessed_season > 1 ? '?s=' + item.guessed_season : ''}'");

code = code.replace(/'#\$\{window\.filterState\.type\}\/\$\{item\.id\}'/g, "'#${window.filterState.type}/${item.id}${item.guessed_season && item.guessed_season > 1 ? '?s=' + item.guessed_season : ''}'");

fs.writeFileSync('d:/work/moive/scripts/ui.js', code);
console.log('Fixed ui.js hashes successfully');
