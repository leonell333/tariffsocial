import {useEffect} from 'react';

const ImagePreviewModal = ({src, onClose}) => {


    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (!src) return null;

    const isVideo = /\.(mp4|webm|ogg)$/i.test(src) || src.includes('post-videos');
    return (
        <div
            className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black bg-opacity-80 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {isVideo ? (
                    <video
                        src={src}
                        controls
                        autoPlay
                        muted
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
                    />
                ) : (
                    <img
                        src={src}
                        alt="Preview"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
                    />
                )}

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white text-xl font-bold"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default ImagePreviewModal;
