// Fetch API 模块实现
const { core } = Deno;

// 实现符合 WHATWG 标准的 Headers 类
class Headers {
  #headers = new Map();

  constructor(init) {
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => this.append(key, value));
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.append(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.append(key, value));
      }
    }
  }

  append(name, value) {
    name = name.toLowerCase();
    const existingValue = this.#headers.get(name);
    if (existingValue) {
      this.#headers.set(name, `${existingValue}, ${value}`);
    } else {
      this.#headers.set(name, String(value));
    }
  }

  delete(name) {
    this.#headers.delete(name.toLowerCase());
  }

  get(name) {
    return this.#headers.get(name.toLowerCase()) || null;
  }

  has(name) {
    return this.#headers.has(name.toLowerCase());
  }

  set(name, value) {
    this.#headers.set(name.toLowerCase(), String(value));
  }

  forEach(callback, thisArg) {
    this.#headers.forEach((value, key) => {
      callback.call(thisArg, value, key, this);
    });
  }

  entries() {
    return this.#headers.entries();
  }

  keys() {
    return this.#headers.keys();
  }

  values() {
    return this.#headers.values();
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  // 用于将 Headers 对象转换为普通对象，方便传递给 Rust
  toObject() {
    const obj = {};
    this.#headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}

// 实现符合 WHATWG 标准的 Request 类
class Request {
  #url;
  #method;
  #headers;
  #body;
  #mode;
  #credentials;

  constructor(input, init = {}) {
    // 处理 input 参数
    if (input instanceof Request) {
      this.#url = input.url;
      this.#method = init.method || input.method;
      this.#headers = new Headers(init.headers || input.headers);
      this.#body = init.body || input.body;
      this.#mode = init.mode || input.mode || 'cors';
      this.#credentials =
        init.credentials || input.credentials || 'same-origin';
    } else {
      this.#url = String(input);
      this.#method = init.method || 'GET';
      this.#headers = new Headers(init.headers);
      this.#body = init.body;
      this.#mode = init.mode || 'cors';
      this.#credentials = init.credentials || 'same-origin';
    }
  }

  get url() {
    return this.#url;
  }

  get method() {
    return this.#method;
  }

  get headers() {
    return this.#headers;
  }

  get body() {
    return this.#body;
  }

  get mode() {
    return this.#mode;
  }

  get credentials() {
    return this.#credentials;
  }

  // 将请求转换为可序列化的对象，传递给 Rust
  toObject() {
    return {
      method: this.#method,
      headers: this.#headers.toObject(),
      body: this.#body,
      mode: this.#mode,
      credentials: this.#credentials,
    };
  }
}

// 实现符合 WHATWG 标准的 Response 类
class Response {
  #url;
  #status;
  #statusText;
  #headers;
  #body;
  #bodyUsed = false;
  #redirected;

  constructor(body = null, init = {}) {
    this.#url = init.url || '';
    this.#status = init.status !== undefined ? init.status : 200;
    this.#statusText = init.statusText || '';
    this.#headers = new Headers(init.headers);
    this.#body = body;
    this.#redirected = init.redirected || false;
  }

  get url() {
    return this.#url;
  }

  get status() {
    return this.#status;
  }

  get statusText() {
    return this.#statusText;
  }

  get headers() {
    return this.#headers;
  }

  get redirected() {
    return this.#redirected;
  }

  get ok() {
    return this.#status >= 200 && this.#status < 300;
  }

  get bodyUsed() {
    return this.#bodyUsed;
  }

  async text() {
    if (this.#bodyUsed) {
      throw new TypeError('Body already used');
    }
    this.#bodyUsed = true;
    return this.#body;
  }

  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }

  // 克隆响应
  clone() {
    if (this.#bodyUsed) {
      throw new TypeError('Cannot clone a used response');
    }
    return new Response(this.#body, {
      url: this.#url,
      status: this.#status,
      statusText: this.#statusText,
      headers: this.#headers,
      redirected: this.#redirected,
    });
  }

  // 从 Rust 返回的对象创建 Response
  static fromRustResponse(rustResponse) {
    const response = new Response(rustResponse.body, {
      url: rustResponse.url,
      status: rustResponse.status,
      statusText: rustResponse.status_text,
      redirected: rustResponse.redirected,
    });

    // 添加响应头
    const headers = response.headers;
    Object.entries(rustResponse.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return response;
  }
}

// 导出初始化函数
export function initFetch() {
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;

  // 实现全局 fetch 方法
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const response = await core.ops.op_fetch(request.url, request.toObject());
    return Response.fromRustResponse(response);
  };
}
