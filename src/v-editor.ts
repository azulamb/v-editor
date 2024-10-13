interface VEditorElement extends HTMLElement {
  readonly: boolean;
}

((script, init) => {
  if (document.readyState !== 'loading') {
    return init(script);
  }
  document.addEventListener('DOMContentLoaded', () => {
    init(script);
  });
})(<HTMLScriptElement> document.currentScript, (script: HTMLScriptElement) => {
  ((component, tagname = 'v-editor') => {
    if (customElements.get(tagname)) {
      return;
    }
    customElements.define(tagname, component);
  })(
    class extends HTMLElement implements VEditorElement {
      private editor: HTMLElement;
      private headerCallbacks: {
        target: HTMLElement;
        callback: (event: MouseEvent) => unknown;
      }[] = [];

      constructor() {
        super();

        const style = document.createElement('style');
        style.innerHTML = [
          ':host { background: #9393933d; width: 100%; display: block; }',
          ':host > div { display: grid; width: 100%; height: 100%; }',
          ':host > div > div { outline: none; overflow: auto; }',
        ].join('');

        this.editor = document.createElement('div');
        if (!this.readonly) {
          this.editor.contentEditable = 'true';
        }
        this.editor.addEventListener('paste', (event) => {
          event.preventDefault();
          event.stopPropagation();
          console.log(event);
          // Non-standard API: https://caniuse.com/mdn-api_shadowroot_getselection
          const selection = (<any>shadow).getSelection(); //document.getSelection();
          if (event.clipboardData && selection) {
            this.onPaste(event.clipboardData, selection);
          }
        });

        const contents = document.createElement('div');
        contents.appendChild(this.editor);

        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(style);
        shadow.appendChild(contents);

        this.changeHeader();
      }

      get readonly() {
        return this.hasAttribute('readonly');
      }

      set readonly(value: boolean) {
        if (value) {
          this.editor.contentEditable = 'false';
          this.setAttribute('readonly', '');
        } else {
          this.editor.contentEditable = 'true';
          this.removeAttribute('readonly');
        }
      }

      protected changeHeader() {
        for (const item of this.headerCallbacks) {
          item.target.removeEventListener('click', item.callback);
        }
        this.headerCallbacks = [];
        const query = this.getAttribute('header');
        if (!query) {
          return;
        }
        const callback = (event: MouseEvent) => {
          const target = <HTMLElement> event.target;
          console.log(target);
          const selection = document.getSelection();
          console.log(selection);
        };
        const elements = document.querySelectorAll(query);
        for (const element of elements) {
          (<HTMLElement> element).addEventListener('click', callback);
          this.headerCallbacks.push({
            target: <HTMLElement> element,
            callback: callback,
          });
        }
      }

      protected onPaste(data: DataTransfer, selection: Selection) {
        const html = data.getData('text/html');
        const parent = document.createElement('div');
        if (html) {
          parent.innerHTML = html;
        } else {
          parent.textContent = data.getData('text/plain');
        }

        const range = selection.getRangeAt(0);
        range.deleteContents();
        for (const element of parent.childNodes) {
          range.insertNode(element);
        }
        selection.collapseToEnd();
      }

      static get observedAttributes() {
        return ['readonly', 'header'];
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
          case 'readonly': {
            this.readonly = newValue !== null || newValue === 'true';
            return;
          }
          case 'header': {
            this.changeHeader();
            return;
          }
        }
      }
    },
    script.dataset.tagname,
  );
});
