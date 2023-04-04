let pprocess = require("child_process");
// 执行 npm run build 命令
pprocess.exec('python main.py', (error: any, stdout: any, stderr: any) => {
  if (!error) {
    // 成功
    console.log("1")
  } else {
    // 失败
  }
});