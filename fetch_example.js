// 测试符合 WHATWG 标准的 fetch API
console.log('开始测试 fetch API...');

// 1. 基本 GET 请求
fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then((response) => {
    console.log(`响应状态: ${response.status} ${response.statusText}`);
    console.log(`响应 URL: ${response.url}`);
    console.log(`是否重定向: ${response.redirected}`);
    console.log(`是否成功 (OK): ${response.ok}`);

    // 输出响应头
    console.log('\n响应头:');
    response.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    return response.json();
  })
  .then((data) => {
    console.log('\n响应数据:');
    console.log(data);
  })
  .catch((error) => {
    console.error('fetch 错误:', error);
  });

// 2. 高级用法: 使用自定义请求头和 POST 方法
setTimeout(() => {
  console.log('\n\n测试 POST 请求和自定义头...');

  fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Header': 'Custom Value',
    },
    body: JSON.stringify({
      title: '测试文章',
      body: '这是一个使用 fetch API 创建的文章',
      userId: 1,
    }),
  })
    .then((response) => {
      console.log(`POST 响应状态: ${response.status} ${response.statusText}`);
      return response.json();
    })
    .then((data) => {
      console.log('POST 响应数据:');
      console.log(data);
    })
    .catch((error) => {
      console.error('POST fetch 错误:', error);
    });
}, 2000);

// 处理响应克隆的测试
setTimeout(() => {
  console.log('\n\n测试响应克隆...');

  fetch('https://jsonplaceholder.typicode.com/todos/2')
    .then((response) => {
      // 克隆响应以便可以多次使用
      const response1 = response.clone();

      // 使用第一个响应
      response.text().then((text) => {
        console.log('第一个响应体 (text):', text.substring(0, 100) + '...');
      });

      // 使用克隆的响应
      return response1.json();
    })
    .then((data) => {
      console.log('克隆的响应体 (json):', data);
    })
    .catch((error) => {
      console.error('克隆测试错误:', error);
    });
}, 4000);
