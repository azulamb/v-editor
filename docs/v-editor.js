((script, init)=>{
    const tagname = script.dataset['v-editor'] || 'v-editor';
    if (customElements.get(tagname)) {
        return;
    }
    if (document.readyState !== 'loading') {
        return init(script, tagname);
    }
    document.addEventListener('DOMContentLoaded', ()=>{
        init(script, tagname);
    });
})(document.currentScript, (script, tagname)=>{
    class DefaultVEditorEvent {
        onPaste(editor, data, selection) {
            const html = data.getData('text/html');
            const parent = document.createElement('div');
            if (html) {
                parent.innerHTML = html;
            } else {
                parent.textContent = data.getData('text/plain');
            }
            editor.insertNodes(parent.childNodes, selection);
        }
    }
    customElements.define(tagname, class extends HTMLElement {
        editorEvent = new DefaultVEditorEvent();
        headerCallbacks = [];
        constructor(){
            super();
            const style = document.createElement('style');
            style.innerHTML = [
                ':host { background: #9393933d; width: 100%; display: block; overflow: auto; padding: 8px; border-radius: 4px; box-sizing: border-box; resize: both; outline: none; }'
            ].join('');
            this.addEventListener('paste', (event)=>{
                this.onPasteEvent(event);
            });
            const shadow = this.attachShadow({
                mode: 'open'
            });
            shadow.appendChild(style);
            shadow.appendChild(document.createElement('slot'));
            this.changeHeader();
        }
        changeHeader() {
            for (const item of this.headerCallbacks){
                item.target.removeEventListener('click', item.callback);
            }
            this.headerCallbacks = [];
            const selector = this.getAttribute('header');
            if (!selector) {
                return;
            }
            const callback = (event)=>{
                const target = event.target;
                console.log(target);
                const selection = document.getSelection();
                console.log(selection);
            };
            for (const element of document.querySelectorAll(selector)){
                element.addEventListener('click', callback);
                this.headerCallbacks.push({
                    target: element,
                    callback: callback
                });
            }
        }
        insertNodes(nodes, selection) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            for (const element of nodes){
                range.insertNode(element);
            }
            selection.collapseToEnd();
        }
        onPasteEvent(event) {
            event.preventDefault();
            event.stopPropagation();
            const data = event.clipboardData;
            if (!data) {
                return;
            }
            const selection = document.getSelection();
            if (!selection) {
                return;
            }
            this.editorEvent.onPaste(this, data, selection);
        }
        static get observedAttributes() {
            return [
                'header'
            ];
        }
        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue === newValue) {
                return;
            }
            switch(name){
                case 'header':
                    {
                        this.changeHeader();
                        return;
                    }
            }
        }
    });
});
