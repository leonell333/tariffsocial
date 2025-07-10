
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Quill from 'quill';
import Delta from 'quill-delta';
import { convertToWebp, } from '../../utils';

const BlockEmbed = Quill.import('blots/block/embed');

class ImageBlot extends BlockEmbed {
  static blotName = 'imageBlot';
  static tagName = 'div';
  static className = 'quill-image-wrapper';

  static create(value) {
    const node = super.create();
    const img = document.createElement('img');
    img.setAttribute('src', value);
    img.className = 'quill-inserted-image';

    const btn = document.createElement('button');
    btn.innerText = '×';
    btn.className = 'quill-delete-btn';
    btn.onclick = () => {
      const next = node.nextSibling;
      if (next && next.tagName === 'P' && next.innerText.match(/(KB|MB)$/)) {
        next.remove();
      }
      node.remove();
    };

    node.appendChild(img);
    node.appendChild(btn);
    return node;
  }

  static value(node) {
    const img = node.querySelector('img');
    return img?.getAttribute('src') || '';
  }
}

if (!Quill.imports['formats/imageBlot']) {
  Quill.register(ImageBlot);
}

const CommentEditor = ({ onReady, placeholder, defaultValue }) => {
  const dispatch = useDispatch();
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || !toolbarRef.current) return;
    const quillInstance = new Quill(editorRef.current, {
      modules: {
        toolbar: toolbarRef.current,
        clipboard: true,
      },
      placeholder: placeholder,
      theme: 'snow',
    });

    if (defaultValue) {
      quillInstance.root.innerHTML = defaultValue;
    }

    onReady(quillInstance);
    toolbarRef.current.style.display = 'none';

    const clipboard = quillInstance.getModule('clipboard');
    clipboard.addMatcher('img', (node, delta) => {
      const src = node.getAttribute('src') || '';
      if (src.startsWith('data:image')) {
        return new Delta();
      }
      return delta;
    });

    clipboard.addMatcher('video', (node, delta) => {
      const src = node.getAttribute('src') || '';
      if (src.startsWith('data:video')) {
        return new Delta();
      }
      return delta;
    });

    quillInstance.root.addEventListener('focus', () => {
      toolbarRef.current.style.display = 'block';
    });

    let blurTimeout;
    quillInstance.root.addEventListener('blur', () => {
      blurTimeout = setTimeout(() => {
        const toolbarEl = toolbarRef.current;
        if (!toolbarEl) return;
        const isToolbarFocused = toolbarEl.contains(document.activeElement);
        if (!isToolbarFocused) {
          toolbarEl.style.display = 'none';
        }
      }, 200);
    });

    toolbarRef.current.addEventListener('focusin', () => {
      clearTimeout(blurTimeout);
    });

    toolbarRef.current.addEventListener('focusout', () => {
      blurTimeout = setTimeout(() => {
        const editorEl = editorRef.current;
        const toolbarEl = toolbarRef.current;
        if (!editorEl || !toolbarEl) return;
        const isEditorFocused = editorEl.contains(document.activeElement);
        if (!isEditorFocused) {
          toolbarEl.style.display = 'none';
        }
      }, 200);
    });

    editorRef.current.addEventListener('paste', (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.includes('image'));

      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          return;
        }
        
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const range = quillInstance.getSelection(true);
            if (!range) {
              return;
            }

            let fileSrc = '';
            if (imageItem) {
              const result = await convertToWebp(file);
              fileSrc = result.dataUrl;
              quillInstance.insertEmbed(range.index, 'imageBlot', fileSrc);
            }
            quillInstance.setSelection(range.index + 1);
          } catch (err) {
            console.error('Media processing failed:', err);
          }
        };
        reader.readAsDataURL(file);
      }
    }, true);

}, [onReady]);

  return (
    <div className="w-full">
      <div ref={editorRef} className="w-full"></div>
      <div ref={toolbarRef} id="quill-toolbar" className="ql-toolbar ql-snow rounded-md mt-1">
        <span className="ql-formats">
          <select className="ql-header">
            <option value="1"></option>
            <option value="2"></option>
            <option value="3"></option>
            <option value="4"></option>
            <option value="5"></option>
            <option defaultValue=""></option>
          </select>
        </span>
        <span className="ql-formats">
          <button className="ql-clean"></button>
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <button className="ql-underline"></button>
          <button className="ql-strike"></button>
        </span>
        <span className="ql-formats">
          <select className="ql-color"></select>
          <select className="ql-background"></select>
        </span>
        <span className="ql-formats">
          <button className="ql-script" value="sub"></button>
          <button className="ql-script" value="super"></button>
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered"></button>
          <button className="ql-list" value="bullet"></button>
          <button className="ql-indent" value="-1"></button>
          <button className="ql-indent" value="+1"></button>
        </span>
        <span className="ql-formats">
          <button className="ql-direction" value="rtl"></button>
        </span>
      </div>
    </div>
  );
};

export default CommentEditor;
