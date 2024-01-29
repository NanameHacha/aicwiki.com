import {loadRemoteFile} from "/web-static/javascript/main.js"
window.addEventListener('load', (/*event*/) => {
  let url ="https://aicwiki.com/assets/zh_cn/excel/料理与烹饪/料理与烹饪-2.xlsx";
  let elementId = "料理与烹饪-2";
  loadRemoteFile(url,elementId);
});