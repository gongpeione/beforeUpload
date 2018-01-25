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

class BeforeUpload extends EventEmitter {
    public static ENABLE_COPY_PASTE = 1;
    public static ENABLE_CLICK = 2;
    public static ENABLE_DRAG = 4;

    private container: HTMLElement;
    private flag: number;
    private inputEl: HTMLInputElement;
    private opt;

    private _files: FileList;
    private on;

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
        
        this.process();
    }

    private process () {
        const addEventsListener = addEvents.bind(this, this.container);

        if (BeforeUpload.ENABLE_CLICK & this.flag) {
            this.on(['click', 'touchend'], e => {
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
                const url = e.clipboardData.getData('text');
                if (toType(e.clipboardData.files[0]) === 'file') {
                    this.upload(e.clipboardData.files[0]);
                } else if (urlRegex.test(url)) {
                    console.log(url);
                    this.upload(url);
                }
            });
            e.clipboardData.files
        }
        if (BeforeUpload.ENABLE_DRAG & this.flag) {
            addEventsListener(this.container, ['dragover', 'dragleave'], (e, name) => {
                e.preventDefault();
                (this as EventEmitter).emit(name);
            });
            addEventsListener('drop', e => {
                e.preventDefault();
                this.files = e.dataTransfer.files;
                (this as EventEmitter).emit('drop');
            });
        }
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

export default BeforeUpload;