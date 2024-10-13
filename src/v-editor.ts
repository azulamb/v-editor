interface VEditorElement extends HTMLElement {
  editorEvent: VEditorEvent;
  insertNodes(
    nodes: NodeListOf<ChildNode> | ChildNode[],
    selection: Selection,
  ): void;
}

interface VEditorEvent {
  onPaste(
    editor: VEditorElement,
    data: DataTransfer,
    selection: Selection,
  ): unknown;
}

((script, init) => {
  const tagname = script.dataset['v-editor'] || 'v-editor';
  if (customElements.get(tagname)) {
    return;
  }
  if (document.readyState !== 'loading') {
    return init(script, tagname);
  }
  document.addEventListener('DOMContentLoaded', () => {
    init(script, tagname);
  });
})(
  <HTMLScriptElement> document.currentScript,
  (script: HTMLScriptElement, tagname: string) => {
    class DefaultVEditorEvent implements VEditorEvent {
      onPaste(
        editor: VEditorElement,
        data: DataTransfer,
        selection: Selection,
      ) {
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

    customElements.define(
      tagname,
      class extends HTMLElement implements VEditorElement {
        public editorEvent: VEditorEvent = new DefaultVEditorEvent();

        private headerCallbacks: {
          target: HTMLElement;
          callback: (event: MouseEvent) => unknown;
        }[] = [];

        constructor() {
          super();

          const style = document.createElement('style');
          style.innerHTML = [
            ':host { background: #9393933d; width: 100%; display: block; overflow: auto; padding: 8px; border-radius: 4px; box-sizing: border-box; resize: both; outline: none; }',
          ].join('');

          this.addEventListener('paste', (event) => {
            this.onPasteEvent(event);
          });

          const shadow = this.attachShadow({ mode: 'open' });
          shadow.appendChild(style);
          shadow.appendChild(document.createElement('slot'));

          this.changeHeader();
        }

        protected changeHeader() {
          // Reset all header callbacks.
          for (const item of this.headerCallbacks) {
            item.target.removeEventListener('click', item.callback);
          }
          this.headerCallbacks = [];
          const selector = this.getAttribute('header');
          if (!selector) {
            return;
          }

          const callback = (event: MouseEvent) => {
            const target = <HTMLElement> event.target;
            console.log(target);
            const selection = document.getSelection();
            console.log(selection);
          };

          for (const element of document.querySelectorAll(selector)) {
            (<HTMLElement> element).addEventListener('click', callback);
            this.headerCallbacks.push({
              target: <HTMLElement> element,
              callback: callback,
            });
          }
        }

        public insertNodes(
          nodes: NodeListOf<ChildNode> | ChildNode[],
          selection: Selection,
        ) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          for (const element of nodes) {
            range.insertNode(element);
          }
          selection.collapseToEnd();
        }

        protected onPasteEvent(event: ClipboardEvent) {
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
          return ['header'];
        }

        attributeChangedCallback(
          name: string,
          oldValue: string,
          newValue: string,
        ) {
          if (oldValue === newValue) {
            return;
          }
          switch (name) {
            case 'header': {
              this.changeHeader();
              return;
            }
          }
        }
      },
    );
  },
);
