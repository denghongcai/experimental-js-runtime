console.log('Hello experimental js runtime!');
const contents = await ejsr.readFile('./example.js');
console.log(contents);
console.log(Date.now());
setTimeout(() => {
  console.log('timeout!', Date.now());
}, 100);
