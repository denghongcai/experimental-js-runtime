const { core } = Deno;

function argsToMessage(...args) {
  return args.map((arg) => JSON.stringify(arg)).join(' ');
}

globalThis.console = {
  log: (...args) => {
    core.print(`[out]: ${argsToMessage(...args)}\n`, false);
  },
  error: (...args) => {
    core.print(`[err]: ${argsToMessage(...args)}\n`, true);
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
