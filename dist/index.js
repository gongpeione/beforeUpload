import { EventEmitter } from 'events';
function addEvents(target, names, cb) {
    if (!Array.isArray(names)) {
        target.addEventListener(names, e => cb(e, name));
        return;
    }
    names.forEach(name => {
        target.addEventListener(name, e => cb(e, name));
    });
}
class BeforeUpload extends EventEmitter {
    constructor(container, flag, opt) {
        super();
        this.disabled = false;
        this.handlers = {};
        this.container = document.querySelector(container) || document.body;
        this.flag = flag || (BeforeUpload.ENABLE_CLICK |
            BeforeUpload.ENABLE_COPY_PASTE |
            BeforeUpload.ENABLE_DRAG);
        this.opt = opt || {};
        this.inputEl = opt.inputEl || document.createElement('input');
        this.inputEl.type = 'file';
        this.inputEl.hidden = true;
        Object.keys(opt).forEach(attr => {
            if (attr in this.inputEl) {
                this.inputEl[attr] = opt[attr];
            }
        });
        this.setCapture();
        this.process();
    }
    process() {
        const addEventsListener = (names, cb, target) => {
            (Array.isArray(names) ? names : [names]).forEach(name => {
                if (!this.handlers[name]) {
                    this.handlers[name] = [];
                }
                this.handlers[name].push(cb);
            });
            const cbWrapped = (...args) => {
                if (this.disabled)
                    return;
                cb(...args);
            };
            addEvents.call(this, target || this.container, names, cbWrapped);
        };
        if (BeforeUpload.ENABLE_CLICK & this.flag) {
            addEventsListener(['click', 'touchend'], e => {
                this.emit('click');
                this.open();
            });
            addEventsListener('change', e => {
                this.files = e.target.files;
            }, this.inputEl);
        }
        if (BeforeUpload.ENABLE_COPY_PASTE & this.flag) {
            if (!('onpaste' in document)) {
                console.error('onpaste is not supported, try to update or change your browser.');
                return;
            }
            addEventsListener('paste', (e) => {
                this.files = e.clipboardData.files;
            });
        }
        if (BeforeUpload.ENABLE_DRAG & this.flag) {
            addEventsListener(['dragover', 'dragleave'], (e, name) => {
                e.preventDefault();
                this.emit(name);
            });
            addEventsListener('drop', e => {
                e.preventDefault();
                this.files = e.dataTransfer.files;
            });
        }
    }
    setCapture() {
        if (this.inputEl.capture) {
            return;
        }
        const accpet = this.inputEl.accept.toLowerCase();
        if (accpet.indexOf('image') > -1) {
            this.inputEl.capture = 'camera';
        }
        else if (accpet.indexOf('audio') > -1) {
            this.inputEl.capture = 'microphone';
        }
        else if (accpet.indexOf('video') > -1) {
            this.inputEl.capture = 'camcorder';
        }
    }
    onfile(e) {
        this.emit('file', this.files, e);
    }
    disable() {
        this.disabled = true;
        // Object.keys(this.handlers).forEach(name => {
        //     const handlerArr = this.handlers[name];
        //     handlerArr.forEach(cb => {
        //         console.log(this.container, name, cb);
        //         this.container.removeEventListener(name, cb);
        //     });
        // });
        // console.log(this);
    }
    open() {
        this.inputEl.click();
    }
    get files() {
        return this._files;
    }
    set files(newVal) {
        this._files = newVal;
        this.emit('file', this.files);
    }
}
BeforeUpload.ENABLE_CLICK = 1;
BeforeUpload.ENABLE_COPY_PASTE = 2;
BeforeUpload.ENABLE_DRAG = 4;
export default function setBeforeUpload(container, flag, opt) {
    return new BeforeUpload(container, flag, opt || {});
}
;
//# sourceMappingURL=index.js.map