// 控制台模块实现
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

// 用于追踪分组级别
let groupLevel = 0;

// 创建带有缩进的消息 (仅用于分组)
function getIndentedMessage(message) {
  return '  '.repeat(groupLevel) + message;
}

// 用于存储计时器的开始时间
const timeMarkers = new Map();

// 导出初始化函数
export function initConsole() {
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
}
