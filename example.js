console.log('=== 运行时测试开始 ===');

// 1. 基础功能测试
console.log('1. 基础功能测试');
console.log('Hello experimental js runtime!');
console.log('当前时间戳:', Date.now());

// 2. 文件系统操作测试
console.log('\n2. 文件系统测试');
const contents = await ejsr.readFile('./example.js');
console.log('文件读取结果:', contents.slice(0, 50) + '...');

try {
  await ejsr.writeFile('./test.txt', 'Hello from runtime!');
  const written = await ejsr.readFile('./test.txt');
  console.log(
    '文件写入/读取测试:',
    written === 'Hello from runtime!' ? '成功' : '失败'
  );
} catch (err) {
  console.error('文件操作错误:', err);
}

// 3. 定时器测试
console.log('\n3. 定时器测试');
console.log('开始时间:', Date.now());

const timer1 = setTimeout(() => {
  console.log('100ms 定时器触发, 时间:', Date.now());
}, 100);

const timer2 = setTimeout(() => {
  console.log('200ms 定时器触发, 时间:', Date.now());
}, 200);

// setInterval 测试
let intervalCount = 0;
console.log('setInterval 测试开始');
const intervalId = setInterval(() => {
  intervalCount++;
  console.log(`setInterval 第${intervalCount}次执行, 时间:`, Date.now());

  // 执行3次后清除interval
  if (intervalCount >= 3) {
    clearInterval(intervalId);
    console.log('setInterval 已清除');
  }
}, 100);

// 4. Fetch API 测试
console.log('\n4. Fetch API 测试');
try {
  const text = await ejsr.fetch('https://api.github.com/zen');
  console.log('Fetch 请求结果:', text);
} catch (err) {
  console.error('Fetch 请求错误:', err);
}

// 等待所有异步操作完成
await new Promise((resolve) => setTimeout(resolve, 500));
console.log('\n=== 运行时测试结束 ===');

// Test crypto module
try {
  const text = "hello world";
  const expectedHash = "5eb63bbbe01eeed093cb22bb8f5acdc3"; // Known MD5 hash for "hello world"
  const actualHash = crypto.md5(text);

  console.log("MD5 Test:");
  console.log("Input:", text);
  console.log("Expected Hash:", expectedHash);
  console.log("Actual Hash:", actualHash);

  if (actualHash === expectedHash) {
    console.log("MD5 Test Passed!");
  } else {
    console.error("MD5 Test Failed!");
  }
} catch (e) {
  console.error("Error during MD5 test:", e.message, e.stack);
}

// It might be good to add a test for non-string input to see if the TypeError is thrown
try {
  console.log("MD5 Test (non-string input):");
  crypto.md5(12345); // Should throw an error
} catch (e) {
  console.log("Caught expected error for non-string input:", e.message);
  if (e instanceof TypeError) {
    console.log("Non-string input test passed (TypeError thrown)!");
  } else {
    console.error("Non-string input test failed (wrong error type)!");
  }
}
