
const fs = require('fs');
const child_process = require('child_process');

// 运行 cmd 并获取返回值  
function runCommand(cmd, callback) {
  child_process.spawn('cmd', [cmd], { stdio: 'inherit' }).on('exit', callback);
}

// 示例：运行"ls -l"并获取返回值  
runCommand('ls -l', (err, stdout, stderr) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  console.log("ls -l", stdout);
  process.exit(0);
});

// 示例：运行"npm install",如果安装成功则输出"npm installed",否则输出错误信息  
runCommand('npm install', (err, stdout, stderr) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  if (stdout.includes('npm installed')) {
    console.log('npm installed');
    process.exit(0);
  }

  console.error("npm install ", 'npm install failed');
  process.exit(1);
});  
