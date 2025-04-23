// 定时器模块实现
const { core } = Deno;

// 存储活跃的间隔定时器
const activeIntervals = new Map();
let nextIntervalId = 1;

// 导出初始化函数
export function initTimer() {
  // 实现 setTimeout
  globalThis.setTimeout = async (callback, delay) => {
    core.ops.op_set_timeout(delay).then(callback);
  };

  // 实现 setInterval
  globalThis.setInterval = (callback, delay) => {
    // 生成一个唯一的ID
    const intervalId = nextIntervalId++;

    // 创建一个递归函数
    const repeat = async () => {
      // 如果interval已被清除，则退出递归
      if (!activeIntervals.has(intervalId)) {
        return;
      }

      try {
        // 执行回调
        callback();

        // 设置下一次执行
        core.ops.op_set_timeout(delay).then(() => {
          repeat();
        });
      } catch (error) {
        console.error(`Error in interval callback: ${error}`);
        // 出错时自动清除间隔
        clearInterval(intervalId);
      }
    };

    // 存储interval信息
    activeIntervals.set(intervalId, true);

    // 开始第一次执行
    core.ops.op_set_timeout(delay).then(repeat);

    // 返回唯一ID
    return intervalId;
  };

  // 实现 clearInterval
  globalThis.clearInterval = (intervalId) => {
    // 从活跃间隔集合中移除
    if (activeIntervals.has(intervalId)) {
      activeIntervals.delete(intervalId);
    }
  };
}
