import setBeforeUpload from '../src/index.ts';

const bu = setBeforeUpload('main .upload', 7, {
    accept: 'image/*',
    multiple: true
});
const preview = document.querySelector('.preview')
console.log(bu);
bu.on('click', e=>console.log('click'));
bu.on('file', f => {
    console.log(f);
    preview.innerHTML = '';
    const fg = document.createDocumentFragment();
    bu.getPreviewList().forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.width = 100;
        img.height = 100;
        fg.appendChild(img);
    });
    preview.appendChild(fg);
});
bu.on('paste', e=>console.log('paste'));
document.querySelector('.disable').addEventListener('click', e=>bu.disable());
document.querySelector('.enable').addEventListener('click', e=>bu.enable());