const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      if (file.endsWith('.jsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync('src');
let changedFilesCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // text-white -> text-slate-900 dark:text-white
  content = content.replace(/(?<![-a-zA-Z0-9:])\btext-white\b(?![-/])/g, 'text-slate-900 dark:text-white');
  
  // text-white/XX -> text-slate-900/XX dark:text-white/XX
  content = content.replace(/(?<![-a-zA-Z0-9:])\btext-white\/([0-9]+)\b/g, 'text-slate-900/$1 dark:text-white/$1');
  
  // bg-white/XX -> bg-slate-200 dark:bg-white/XX
  content = content.replace(/(?<![-a-zA-Z0-9:])\bbg-white\/([0-9]+)\b/g, 'bg-slate-200 dark:bg-white/$1');
  
  // border-white/XX -> border-slate-300 dark:border-white/XX
  content = content.replace(/(?<![-a-zA-Z0-9:])\bborder-white\/([0-9]+)\b/g, 'border-slate-300 dark:border-white/$1');
  
  // hover:text-white -> hover:text-slate-900 dark:hover:text-white
  content = content.replace(/(?<![-a-zA-Z0-9:])\bhover:text-white\b(?![-/])/g, 'hover:text-slate-900 dark:hover:text-white');
  
  // hover:text-white/XX -> hover:text-slate-900/XX dark:hover:text-white/XX
  content = content.replace(/(?<![-a-zA-Z0-9:])\bhover:text-white\/([0-9]+)\b/g, 'hover:text-slate-900/$1 dark:hover:text-white/$1');
  
  // hover:bg-white/XX -> hover:bg-slate-300 dark:hover:bg-white/XX
  content = content.replace(/(?<![-a-zA-Z0-9:])\bhover:bg-white\/([0-9]+)\b/g, 'hover:bg-slate-300 dark:hover:bg-white/$1');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFilesCount++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Done! Updated ${changedFilesCount} files.`);
