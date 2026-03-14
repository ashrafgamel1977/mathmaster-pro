const fs = require('fs');
let app = fs.readFileSync('App.tsx', 'utf8');
const files = ['Assignments', 'Files', 'Courses', 'Management', 'Settings', 'Leaderboard', 'Notifications', 'Formulas', 'Registration', 'Schedules', 'Sections', 'ChatRoom', 'QuestionBank'];

files.forEach(f => {
  if (fs.existsSync('pages/' + f + '.tsx')) {
    fs.renameSync('pages/' + f + '.tsx', 'pages/' + f + 'Page.tsx');
    console.log(`Renamed ${f}.tsx to ${f}Page.tsx`);
  }
  app = app.replace(new RegExp("'./pages/" + f + "';", 'g'), "'./pages/" + f + "Page';");
});

fs.writeFileSync('App.tsx', app);
console.log('App.tsx updated.');
