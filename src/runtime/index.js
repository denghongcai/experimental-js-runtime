// 主入口文件
// 导入各个功能模块
import { initConsole } from './modules/console.js';
import { initFetch } from './modules/fetch.js';
import { initFS } from './modules/fs.js';
import { initTimer } from './modules/timer.js';
import * as crypto from './modules/crypto.js';

// 初始化所有模块
initConsole(); // 初始化控制台功能
initFetch(); // 初始化 Fetch API
initFS(); // 初始化文件系统操作
initTimer(); // 初始化定时器功能

// 扩展 ejsr 对象，添加 fetch 功能
globalThis.ejsr = globalThis.ejsr || {};
globalThis.ejsr.fetch = async (url) => {
  return globalThis.fetch(url);
};

globalThis.crypto = crypto;
