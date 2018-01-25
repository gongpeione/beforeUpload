import setBeforeUpload from '../src/index.ts';

const bu = setBeforeUpload('main', 3);
console.log(bu);
bu.on('click', e=>console.log('click'));
bu.on('file', f => console.log(f));
bu.on('paste', e=>console.log('paste'));
document.querySelector('.disable').addEventListener('click', e=>bu.disable());