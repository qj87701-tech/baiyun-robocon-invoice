广东白云学院 ROBOCON 票据助手

这是从原站完整抓取并本地化保存的静态站点副本。

包含：
- 页面 HTML、CSS 与全部交互脚本
- PDF.js worker、中文 CMap 与标准字体
- Tesseract OCR worker 与四套兼容内核
- Logo、ROBOCON 海报背景图
- 两份材料验收单 Excel 模板

注意：
- 不要直接双击 index.html；浏览器模块和 worker 需要通过 HTTP(S) 访问。
- 可将本目录部署到任意静态网站托管平台。
- OCR 首次识别仍会按原站逻辑从 jsDelivr 下载并缓存中英文识别模型。
- 票据只在浏览器本机处理，不会上传到服务器。

原站：
https://site-creator-vinext-starter.robot-invoice-tool.workers.dev/
