---
title: 表格单元格合并
description: 
published: true
date: 2024-11-01T08:14:44.957Z
tags: wiki-guide
editor: markdown
dateCreated: 2024-01-29T18:45:02.560Z
---

# 表格单元格合并

## 仅涉及横向(行)单元格合并

在基础语法中，`---`用于分割标题单元格和普通单元格，在扩展语法种，你可以在上方添加多行标题单元格，并使用特定语法完成单元格合并操作。
例如：

```
| 额外标题合并(3个单元格)|||
| 标题单元格① | 标题单元格② | 标题单元格③ |
| --- | :---: | ---:   |
| 内容 | 占用两个格子 ||
| 内容 | **内容** | 内容 |
| 新的一部分 | 更多 | 更多 |
| 更多 | 带有一个跳过的 '\|' ||
```
如果每行设定3个单元格，每行应当为`| 单元格① | 单元格② | 单元格③ |`，在扩展语法中可通过留空后方单元格内容(包括空格)，来使后方单元格和当前单元格合并。`| 单元格① | 单元格②③ ||`

渲染效果：
| 额外标题合并(3个单元格)|||
| 标题单元格① | 标题单元格② | 标题单元格③ |
| --- | :---: | ---:   |
| 内容 | 占用两个格子 ||
| 内容 | **内容** | 内容 |
| 新的一部分 | 更多 | 更多 |
| 更多 | 带有一个跳过的 '\|' ||

## 涉及纵向(列)单元格合并

在Markdown扩展语法中并不支持列合并，所以我们需要用到Microsoft Excel。
目前本站点支持使用我们开发的框架来嵌入并自动渲染`.xlsx`文件，但需要手动设定部分内容和注意部分排版事项。

> 此方法步骤较为复杂，每一步需严格按照要求进行，出现失误可能导致表格渲染不正常/无法渲染。
{.is-warning}

### 1. 下载模板文件/需要编辑的文件

请前往[网站资源](/zh/useful-resource)下载文件到本地。

### 2. 创建、编辑、上传、Excel文件
> 此处的上传语言目录均以中文为示例，其他语言请上传至对应目录结构)
{.is-warning}

#### 创建

文件名规范应当为：`<区块名>-<表顺序号>.xlsx`
例如: `烹饪-1.xlsx` 和 `烹饪-2.xlsx`

#### 编辑

在此Excel中，换行不可使用回车换行，应当使用`<br>`进行换行操作；
同时所有的样式设计并不会在渲染中生效，所以可以使用任意样式标注以便于编辑；
其次进行合并操作的单元格中的文字将会自动居中，若想保持格式整齐可以考虑将同列文本或同行(标题行)文本进行居中对齐，具体对其方式见下方。

**Excel中的样式使用(对实际渲染)**

颜色: `<font color=颜色代码/srgb代码>样例文本</font>`
颜色代码与萌娘百科一致，支持 `red/green/orange` 等
srgb代码则为 `#******` 格式，例如天蓝色 `#66ccff`

对齐: `<p align=方向>样例文本</p>`
方向: `right/left/center`

超链接: `<a href=链接 target=_blank>样例文本</a>`
取消下划线: `<a href=链接 target=_blank style=text-decoration:none>样例文本</a>`

三种样式中的参数除对齐以外都可以通过`style`参数混合使用，例如创建一个天蓝色居中无下划线对齐的超链接:
`<a href=链接 target=_blank style="text-decoration:none;color:#66ccff;"><p align=center>样例文本</p></a>`

以及其他HTML文本格式均可使用在此处，在非Excel表格编辑时请尽量使用Markdown语法。

> Excel制表不支持空白单元格，无内容单元格请使用`/`或`-`等内容填充。
{.is-warning}

#### 上传

上传通道位于任意页面编辑界面的左侧`插入文件`中
对于Excel表格应当上传至 `/assets/<对应语言代码目录>/excel/<对应区块目录>` 中
例如中文料理与烹饪的第一个Excel表格位于
`/assets/zh_cn/excel/烹饪与料理/`
文件名为 ``烹饪与料理-1.xlsx``

### 3.设置加载器

#### 设置加载ID和加载路径

重命名加载器模板文件，使其与Excel文件名一致，例如`烹饪与料理-1.js`
使用任意文本编辑器打开此文件进行编辑：
修改 `let url ="https://aicwiki.com/zh_cn/assets/excel/template/template.xlsx";`
中的 `folder` 为实际文件夹名，`template.xlsx` 为实际文件名；
修改 `let elementId = "template-x";` 中的 `template-x` 为实际ID，ID应与文件名一致。

例如对于 `烹饪与料理-1.xlsx` 应为
`let url ="https://aicwiki.com/zh_cn/assets/excel/烹饪与料理/烹饪与料理-1.xlsx";`
`let elementId = "烹饪与料理-1";`

设置完成后保存更改。

#### 上传加载器

文件应当上传至区块目录中的 `loader` 文件夹中。

例如对于 `烹饪与料理-1.js` 应上传至
`/assets/zh_cn/excel/烹饪与料理/loader`

#### 启用加载器

在需要插入表格的页面的编辑界面中，于本页源文本头部
按每行一个填写
`<script type="module" src="/assets/zh_cn/excel/区块目录/loader/表格加载器-x.js"></script>`

例如对于 `烹饪与料理-1.js` 应填写
`<script type="module" src="/assets/zh_cn/excel/料理与烹饪/loader/料理与烹饪-1.js"></script>`

#### 在文本中插入表格

在需要插入表格的地方填写
`<div class="table-container" id="实际ID"></div>`

例如我要在`文本①`和`文本②`中间插入表格`烹饪与料理-1.xlsx`:
```
文本①

<div class="table-container" id="烹饪与料理-1"></div>

文本②
```

完成编辑后点击右上角`保存`即可。

### 4.填写表格链接至【已有/使用中Excel表格文件下载】页面

请在完成上传后在[【已有/使用中Excel表格文件下载】](/zh/useful-resource/exist-excel)更新文件列表。