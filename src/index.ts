import { EventEmitter } from 'events';

function addEvents (target, names, cb) {
    if (!Array.isArray(names)) {
        target.addEventListener(names, e => cb(e, name));
        return;
    }
    names.forEach(name => {
        target.addEventListener(name, e => cb(e, name));
    });
}

interface HTMLInputFileElement extends HTMLInputElement {
    capture: string
}

class BeforeUpload extends EventEmitter {
    public static ENABLE_COPY_PASTE = 1;
    public static ENABLE_CLICK = 2;
    public static ENABLE_DRAG = 4;

    private container: HTMLElement;
    private flag: number;
    private inputEl: HTMLInputFileElement;
    private opt;

    private _files: FileList;
    private on;

    private handlers = {};

    constructor (container: HTMLElement, flag: number, opt?) {
        super();
        this.container = container || document.body;
        this.flag = flag || (  
                        BeforeUpload.ENABLE_CLICK | 
                        BeforeUpload.ENABLE_COPY_PASTE | 
                        BeforeUpload.ENABLE_DRAG
                    );
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

    private process () {
        const addEventsListener = (names, cb, ...args) => {
            names.forEach(name => {
                if (!this.handlers[names]) {
                    this.handlers[names] = [];
                }
                this.handlers[names].push(cb);
            });
            addEvents.call(this, this.container, names, cb, ...args);
        }

        if (BeforeUpload.ENABLE_CLICK & this.flag) {
            addEventsListener(['click', 'touchend'], e => {
                (this as EventEmitter).emit('click');
                this.open();
            });
        }
        if (BeforeUpload.ENABLE_COPY_PASTE & this.flag) {
            if (!('onpaste' in document)) {
                console.error('onpaste is not supported, try to update or change your browser.');
                return;
            }
            addEventsListener('paste', (e: ClipboardEvent) => {
                this.files = e.clipboardData.files;
                (this as EventEmitter).emit('file', this.files, e);
            });
        }
        if (BeforeUpload.ENABLE_DRAG & this.flag) {
            addEventsListener(this.container, ['dragover', 'dragleave'], (e, name) => {
                e.preventDefault();
                (this as EventEmitter).emit(name);
            });
            addEventsListener('drop', e => {
                e.preventDefault();
                this.files = e.dataTransfer.files;
                (this as EventEmitter).emit('file', this.files, e);
            });
        }
    }

    private setCapture () {
        if (this.inputEl.capture) {
            return;
        }
        const accpet = this.inputEl.accept.toLowerCase();
        if (accpet.indexOf('image') > -1) {
            this.inputEl.capture = 'camera';
        } else if (accpet.indexOf('audio') > -1) {
            this.inputEl.capture = 'microphone'
        } else if (accpet.indexOf('video') > -1) {
            this.inputEl.capture = 'camcorder'
        }
    }

    private disable () {
        Object.keys(this.handlers).forEach(name => {
            const handlerArr = this.handlers[name];
            handlerArr.forEach(cb => {
                this.container.removeEventListener(name, cb);
            });
        });
    }

    private open () {
        this.inputEl.click();
    }

    get files () {
        return this._files;
    }

    set files (newVal) {
        this._files = newVal;
        (this as EventEmitter).emit('file', this.files);
    }
}

export default function setBeforeUpload (container: HTMLElement, flag: number, opt?) {
    return new BeforeUpload(container, flag, opt || {});
};