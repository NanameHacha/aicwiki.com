import {loadRemoteFile} from "/web-static/javascript/main.js"
window.addEventListener('load', (/*event*/) => {
  let url ="https://aicwiki.com/assets/zh_cn/excel/炼金与合成/炼金-1.xlsx";
  let elementId = "炼金-1";
  loadRemoteFile(url,elementId);
});