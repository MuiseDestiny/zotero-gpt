# Zotero GPT

GPT Meets Zotero.

本插件面向具有一定编程基础的用户。

## 快速使用

使用方法：`Shift + /`，选中PDF文字请按`Shift + Tab + /`

使用之前，请先配置密钥，如下图：

![image](https://user-images.githubusercontent.com/51939531/228170449-200bd14f-98db-42ee-bebc-cbc11e742ab8.png)

## 增加命令标签

插件设计理念是，根据不同应用场景配置命令标签，直接点击标签即可完成与GPT的交互。

输入`#标签名[color=#eee][position=1]`然后回车即可进入标签命令编辑模式，`Ctrl + S`保存，`Ctrl + R`保存并运行。
color可简写为c，position可简写为pos，值可以加引号，如`#测试[c=#eee][pos=9]`是合法的。当然color和position是可选参数，不输入会有默认值。

在接下来的编辑里你可以像下面这样声明一个当前环境可执行的代码片段

![image](https://user-images.githubusercontent.com/51939531/228172456-6ebf2602-61a3-4b42-8044-d68eb7069839.png)

它会被真正执行，返回结果会替换这里的代码片段。

你可以命令GPT输出一个代码片段，插件可以执行它。

你可以鼠标左键长按一个标签，进入它的编辑模式，**鼠标右键长按是删除**，单击是执行。

你可以在安装插件后，逐个长按，查看示例标签的内部语句，相信你很快就可以上手写一个新的标签。

使用效果：

![image](https://user-images.githubusercontent.com/51939531/228160924-ba1b7cda-f84e-4594-a8d4-c4619ef0cdf0.png)

![image](https://user-images.githubusercontent.com/51939531/228160980-12a68f31-d6fe-43a1-9e68-6f8d11fae12e.png)
