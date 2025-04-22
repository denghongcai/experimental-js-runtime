const { core } = Deno;

// 改进对象格式化，更接近 Node.js 的实现
function formatValue(value, depth = 0) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (Array.isArray(value)) {
    if (depth > 2) return '[ Array ]';
    const items = value.map((item) => formatValue(item, depth + 1)).join(', ');
    return `[ ${items} ]`;
  }

  if (typeof value === 'object') {
    if (depth > 2) return '{ Object }';
    try {
      if (value instanceof Error) {
        return value.stack || `${value.name}: ${value.message}`;
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      const entries = Object.entries(value).map(
        ([k, v]) => `${k}: ${formatValue(v, depth + 1)}`
      );

      return `{ ${entries.join(', ')} }`;
    } catch (e) {
      return Object.prototype.toString.call(value);
    }
  }

  if (typeof value === 'string') return value;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return '[Function]';

  return String(value);
}

function argsToMessage(...args) {
  return args.map((arg) => formatValue(arg)).join(' ');
}

// 用于存储计时器的开始时间
const timeMarkers = new Map();
// 用于追踪分组级别
let groupLevel = 0;

// 创建带有缩进的消息 (仅用于分组)
function getIndentedMessage(message) {
  return '  '.repeat(groupLevel) + message;
}

globalThis.console = {
  log: (...args) => {
    core.print(`${getIndentedMessage(argsToMessage(...args))}\n`, false);
  },

  info: (...args) => {
    core.print(`${getIndentedMessage(argsToMessage(...args))}\n`, false);
  },

  warn: (...args) => {
    // 在标准实现中，warn 通常输出到 stderr
    core.print(`${getIndentedMessage(argsToMessage(...args))}\n`, true);
  },

  error: (...args) => {
    core.print(`${getIndentedMessage(argsToMessage(...args))}\n`, true);
  },

  debug: (...args) => {
    core.print(`${getIndentedMessage(argsToMessage(...args))}\n`, false);
  },

  trace: (...args) => {
    const message = args.length > 0 ? argsToMessage(...args) : '';
    const stackLines = new Error().stack.split('\n').slice(1);

    let output = message ? `${message}\n` : '';
    output += stackLines.map((line) => getIndentedMessage(line)).join('\n');

    core.print(`${output}\n`, false);
  },

  assert: (condition, ...args) => {
    if (!condition) {
      const message =
        args.length > 0 ? argsToMessage(...args) : 'Assertion failed';
      // Node.js 在 assert 失败时也使用 stderr
      core.print(
        `${getIndentedMessage(`Assertion failed: ${message}`)}\n`,
        true
      );
    }
  },

  group: (...args) => {
    const label = args.length > 0 ? argsToMessage(...args) : '';
    if (label) {
      core.print(`${getIndentedMessage(label)}\n`, false);
    }
    groupLevel++;
  },

  groupCollapsed: (...args) => {
    // 在简单实现中，groupCollapsed 和 group 行为一致
    console.group(...args);
  },

  groupEnd: () => {
    if (groupLevel > 0) {
      groupLevel--;
    }
  },

  time: (label = 'default') => {
    timeMarkers.set(label, Date.now());
  },

  timeLog: (label = 'default') => {
    if (timeMarkers.has(label)) {
      const duration = Date.now() - timeMarkers.get(label);
      core.print(`${getIndentedMessage(`${label}: ${duration}ms`)}\n`, false);
    } else {
      core.print(
        `${getIndentedMessage(`Timer '${label}' does not exist`)}\n`,
        true
      );
    }
  },

  timeEnd: (label = 'default') => {
    if (timeMarkers.has(label)) {
      const duration = Date.now() - timeMarkers.get(label);
      core.print(`${getIndentedMessage(`${label}: ${duration}ms`)}\n`, false);
      timeMarkers.delete(label);
    } else {
      core.print(
        `${getIndentedMessage(`Timer '${label}' does not exist`)}\n`,
        true
      );
    }
  },

  clear: () => {
    // 在 Node.js 中，clear 通常会发送特殊的 ANSI 转义序列来清屏
    // 在简单实现中，我们仅输出一个换行
    core.print('\n', false);
    groupLevel = 0;
  },

  // 更人性化的对象展示方法
  dir: (obj, options = {}) => {
    const result = formatValue(obj);
    core.print(`${getIndentedMessage(result)}\n`, false);
  },

  // 表格展示数据
  table: (tabularData, properties) => {
    // 简单实现，仅显示对象
    console.log(tabularData);
  },
};

globalThis.ejsr = {
  readFile: (path) => {
    return core.ops.op_read_file(path);
  },
  writeFile: (path, contents) => {
    return core.ops.op_write_file(path, contents);
  },
  fetch: async (url) => {
    return core.ops.op_fetch(url);
  },
};

globalThis.setTimeout = async (callback, delay) => {
  core.ops.op_set_timeout(delay).then(callback);
};

// 存储活跃的间隔定时器
const activeIntervals = new Map();
let nextIntervalId = 1;

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

globalThis.clearInterval = (intervalId) => {
  // 从活跃间隔集合中移除
  if (activeIntervals.has(intervalId)) {
    activeIntervals.delete(intervalId);
  }
};
