import {useEffect, useRef} from 'react';
import {convertToWebp,} from '../../utils';


const Delta = window.Quill.import('delta');
const BlockEmbed = window.Quill.import('blots/block/embed');

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

class VideoBlot extends BlockEmbed {
    static blotName = 'videoBlot';
    static tagName = 'div';
    static className = 'quill-video-wrapper';

    static create(value) {
        const node = super.create();
        const video = document.createElement('video');
        video.setAttribute('src', value);
        video.setAttribute('controls', true);
        video.setAttribute('width', '100%');
        video.className = 'quill-inserted-video';

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

        node.appendChild(video);
        node.appendChild(btn);
        return node;
    }

    static value(node) {
        const video = node.querySelector('video');
        return video?.getAttribute('src') || '';
    }
}

if (!window.Quill.imports['formats/imageBlot']) {
    window.Quill.register(ImageBlot);
}

if (!window.Quill.imports['formats/videoBlot']) {
    window.Quill.register(VideoBlot);
}

const PostEditor = ({onReady, placeholder,}) => {
    const editorRef = useRef(null);

    useEffect(() => {
        if (!editorRef.current) return;
        const quillInstance = new window.Quill(editorRef.current, {
            modules: {
                toolbar: false,
                clipboard: true,
            },
            placeholder: placeholder,
            theme: 'snow',
        });
        onReady(quillInstance);

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
            // No need to show toolbar
        });

        let blurTimeout;
        quillInstance.root.addEventListener('blur', () => {
            blurTimeout = setTimeout(() => {
                // No need to hide toolbar
            }, 200);
        });

        editorRef.current.addEventListener('paste', (e) => {
            const items = Array.from(e.clipboardData?.items || []);
            const imageItem = items.find(item => item.type.includes('image'));
            const videoItem = items.find(item => item.type.includes('video'));

            if (imageItem || videoItem) {
                e.preventDefault();
                const file = (imageItem || videoItem).getAsFile();
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
                            // resize image to max 582px width
                            const result = await convertToWebp(file, 582);
                            fileSrc = result.dataUrl;
                            quillInstance.insertEmbed(range.index, 'imageBlot', fileSrc);
                        } else if (videoItem) {
                            fileSrc = URL.createObjectURL(file);
                            quillInstance.insertEmbed(range.index, 'videoBlot', fileSrc);
                        }
                        quillInstance.setSelection(range.index + 1);
                    } catch (err) {
                        console.error('Media processing failed:', err);
                    }
                };
                reader.readAsDataURL(file);
            }
        }, true);
    }, [onReady, placeholder]);

    return (
        <div className="w-full">
            <div ref={editorRef} className="w-full"></div>
        </div>
    );
};

export default PostEditor;
