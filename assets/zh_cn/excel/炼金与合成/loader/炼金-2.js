import {loadRemoteFile} from "/web-static/javascript/main.js"
window.addEventListener('load', (/*event*/) => {
  let url ="https://aicwiki.com/assets/zh_cn/excel/炼金与合成/炼金-2.xlsx";
  let elementId = "炼金-2";
  loadRemoteFile(url,elementId);
});