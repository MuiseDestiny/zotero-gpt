

let his: any = [
  {
    author: "AI",
    msg: "1"
  },
  {
    author: "uplaceholder",
    msg: "continue"
  },
  {
    author: "AI",
    msg: "2"
  },
  {
    author: "uplaceholder",
    msg: "continue"
  },
]
let preResponseText = ""
let joinPre = (lastIndex: number): any => {
  if (his[lastIndex].author == "uplaceholder" && his[lastIndex].msg == "continue") {
    let i = lastIndex - 1
    for (i; i >= 0; i--) {
      if (his[i].author == "AI") {
        preResponseText = his[i].msg + preResponseText
      } else {
        joinPre(i)
        break
      }
    }
  }
}
joinPre(his.length - 1)
  
console.log(preResponseText)