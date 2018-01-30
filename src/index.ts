import { EventEmitter } from 'events';

function addEvents (target, names, cb) {
    if (!Array.isArray(names)) {
        target.addEventListener(names, cb);
        return;
    }
    names.forEach(name => {
        target.addEventListener(name, cb);
    });
}

interface HTMLInputFileElement extends HTMLInputElement {
    capture: string
}

const defaultOpt = {
    pasteOnDoc: true
};

export class BeforeUpload extends EventEmitter {
    public static ENABLE_CLICK = 1;
    public static ENABLE_COPY_PASTE = 2;
    public static ENABLE_DRAG = 4;

    private container: HTMLElement;
    private flag: number;
    private inputEl: HTMLInputFileElement;
    private opt;
    private disabled = false;
    
    public previews = [];

    private _files: FileList;

    private handlers = {};

    constructor (container: string, flag: number, opt?) {
        super();
        this.container = document.querySelector(container) || document.body;
        this.flag = flag || (  
                        BeforeUpload.ENABLE_CLICK | 
                        BeforeUpload.ENABLE_COPY_PASTE | 
                        BeforeUpload.ENABLE_DRAG
                    );
        this.opt = Object.assign(opt, defaultOpt);
        this.inputEl = opt.inputEl || document.createElement('input');
        this.inputEl.type = 'file';
        this.inputEl.hidden = true;

        Object.keys(opt).forEach(attr => {
            if (attr in this.inputEl) {
                this.inputEl[attr] = opt[attr];
            }
        });
        
        this.process();
    }

    private process () {
        this.setCapture();
        this.addEvents();
    }

    private addEvents () {
        const addEventsListener = (names, cb, target?) => {
            (Array.isArray(names) ? names : [names]).forEach(name => {
                if (!this.handlers[name]) {
                    this.handlers[name] = [];
                }
                this.handlers[name].push(cb);
            });
            // const cbWrapped = (...args) => {
            //     if (this.disabled) return;
            //     cb(...args);
            // }
            addEvents.call(this, target || this.container, names, cb);
        }

        if (BeforeUpload.ENABLE_CLICK & this.flag) {
            const clickEventType = (document.ontouchend !== null) ? 'click' : 'touchend';
            addEventsListener(clickEventType, e => {
                (this as EventEmitter).emit(e.type);
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
            addEventsListener('paste', (e: ClipboardEvent) => {
                console.log(e.clipboardData.files.length);
                (this as EventEmitter).emit(e.type);
                this.files = e.clipboardData.files;
            }, this.opt.pasteOnDoc ? document : this.container); // Recommend add paste event on document 
        }
        if (BeforeUpload.ENABLE_DRAG & this.flag) {
            addEventsListener(['dragover', 'dragleave'], e => {
                if (e.target !== this.container) return;
                e.preventDefault();
                (this as EventEmitter).emit(e.type);
            });
            addEventsListener('drop', e => {
                if (e.target !== this.container) return;
                e.preventDefault();
                (this as EventEmitter).emit(e.type);
                this.files = e.dataTransfer.files;
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

    private onfile (e?) {
        (this as EventEmitter).emit('file', this.files, e);
    }

    public disable () {
        this.disabled = true;
        Object.keys(this.handlers).forEach(name => {
            const handlerArr = this.handlers[name];
            handlerArr.forEach(cb => {
                this.container.removeEventListener(name, cb);
            });
        });
        this.previews.forEach(url => URL.revokeObjectURL(url));
    }

    public getPreviewList () {
        const accpet = this.inputEl.accept.toLowerCase();
        if (accpet.indexOf('image') === -1) {
            throw new Error('Only images supported.');
        } 

        this.previews = Array.from(this.files, file => {
            return URL.createObjectURL(file);
        });

        return this.previews;
    }

    public enable () {
        if (!this.disabled) return;
        this.disabled = false;
        this.addEvents();
    }

    private open () {
        this.inputEl.value = '';
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

export default function setBeforeUpload (container: string, flag: number, opt?) {
    return new BeforeUpload(container, flag, opt || {});
};