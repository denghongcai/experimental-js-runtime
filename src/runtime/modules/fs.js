// 文件系统模块实现
const { core } = Deno;

// 导出初始化函数
export function initFS() {
  // 添加文件系统操作到全局 ejsr 对象
  globalThis.ejsr = globalThis.ejsr || {};

  // 扩展 ejsr 对象的文件系统功能
  Object.assign(globalThis.ejsr, {
    readFile: (path) => {
      return core.ops.op_read_file(path);
    },
    writeFile: (path, contents) => {
      return core.ops.op_write_file(path, contents);
    },
  });
}
