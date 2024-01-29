import {loadRemoteFile} from "/web-static/javascript/main.js"
window.addEventListener('load', (/*event*/) => {
  let url ="https://aicwiki.com/assets/zh_cn/excel/相关音乐/相关音乐-1.xlsx";
  let elementId = "相关音乐-1";
  loadRemoteFile(url,elementId);
});