((script, init)=>{
    if (document.readyState !== 'loading') {
        return init(script);
    }
    document.addEventListener('DOMContentLoaded', ()=>{
        init(script);
    });
})(document.currentScript, (script)=>{
    ((component, tagname = 'v-editor')=>{
        if (customElements.get(tagname)) {
            return;
        }
        customElements.define(tagname, component);
    })(class extends HTMLElement {
        editor;
        headerCallbacks = [];
        constructor(){
            super();
            const style = document.createElement('style');
            style.innerHTML = [
                ':host { background: #9393933d; width: 100%; display: block; }',
                ':host > div { display: grid; width: 100%; height: 100%; }',
                ':host > div > div { outline: none; overflow: auto; }'
            ].join('');
            this.editor = document.createElement('div');
            if (!this.readonly) {
                this.editor.contentEditable = 'true';
            }
            this.editor.addEventListener('paste', (event)=>{
                event.preventDefault();
                event.stopPropagation();
                console.log(event);
                const selection = shadow.getSelection();
                if (event.clipboardData && selection) {
                    this.onPaste(event.clipboardData, selection);
                }
            });
            const contents = document.createElement('div');
            contents.appendChild(this.editor);
            const shadow = this.attachShadow({
                mode: 'open'
            });
            shadow.appendChild(style);
            shadow.appendChild(contents);
            this.changeHeader();
        }
        get readonly() {
            return this.hasAttribute('readonly');
        }
        set readonly(value) {
            if (value) {
                this.editor.contentEditable = 'false';
                this.setAttribute('readonly', '');
            } else {
                this.editor.contentEditable = 'true';
                this.removeAttribute('readonly');
            }
        }
        changeHeader() {
            for (const item of this.headerCallbacks){
                item.target.removeEventListener('click', item.callback);
            }
            this.headerCallbacks = [];
            const query = this.getAttribute('header');
            if (!query) {
                return;
            }
            const callback = (event)=>{
                const target = event.target;
                console.log(target);
                const selection = document.getSelection();
                console.log(selection);
            };
            const elements = document.querySelectorAll(query);
            for (const element of elements){
                element.addEventListener('click', callback);
                this.headerCallbacks.push({
                    target: element,
                    callback: callback
                });
            }
        }
        onPaste(data, selection) {
            const html = data.getData('text/html');
            const parent = document.createElement('div');
            if (html) {
                parent.innerHTML = html;
                console.log(parent);
            } else {
                parent.textContent = data.getData('text/plain');
            }
            const range = selection.getRangeAt(0);
            console.log(range);
            range.deleteContents();
            for (const element of parent.childNodes){
                range.insertNode(element);
            }
            selection.collapseToEnd();
        }
        static get observedAttributes() {
            return [
                'readonly',
                'header'
            ];
        }
        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue === newValue) {
                return;
            }
            switch(name){
                case 'readonly':
                    {
                        this.readonly = newValue !== null || newValue === 'true';
                        return;
                    }
                case 'header':
                    {
                        this.changeHeader();
                        return;
                    }
            }
        }
    }, script.dataset.tagname);
});
