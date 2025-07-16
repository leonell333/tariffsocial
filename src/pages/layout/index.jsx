import {useState, useEffect, useRef} from 'react';
import {Outlet} from 'react-router';
import LeftSide from './leftSide';
import RightSide from './rightSide';

const MainLayout = () => {
    const layoutRef = useRef(null);
    const [layoutLeft, setLayoutLeft] = useState(0);
    const [layoutWidth, setLayoutWidth] = useState(1320);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);
    const LEFT_SIDE_WIDTH = 250;
    const RIGHT_SIDE_WIDTH = 300;
    const SIDE_MARGIN = 70;
    const CONSTANT_GAP = 0;
    const SCALE = 0.92;
    const CUSTOM_SCROLLBAR_WIDTH = 8;

    const detectScrollbar = () => {
        const mainContent = document.querySelector('.main-content-scrollable');
        if (mainContent) {
            const hasScrollbar = mainContent.scrollHeight > mainContent.clientHeight;
            setScrollbarWidth(hasScrollbar ? CUSTOM_SCROLLBAR_WIDTH : 0);
        }
    };

    useEffect(() => {
        const updateLayout = () => {
            if (layoutRef.current) {
                const rect = layoutRef.current.getBoundingClientRect();
                setLayoutLeft(rect.left);
                setLayoutWidth(rect.width);
            }
        };

        updateLayout();
        detectScrollbar();
        window.addEventListener('resize', updateLayout);
        const resizeObserver = new ResizeObserver(() => {
            setTimeout(detectScrollbar, 10);
        });
        const mainContent = document.querySelector('.main-content-scrollable');
        if (mainContent) {
            resizeObserver.observe(mainContent);
        }
        return () => {
            window.removeEventListener('resize', updateLayout);
            resizeObserver.disconnect();
        };
    }, []);

    const leftScaleOffset = (LEFT_SIDE_WIDTH * (1 - SCALE)) / 2;
    const rightScaleOffset = (RIGHT_SIDE_WIDTH * (1 - SCALE)) / 2;
    const leftSideLeft = layoutLeft + SIDE_MARGIN;
    const rightSideLeft = layoutLeft + layoutWidth - RIGHT_SIDE_WIDTH - SIDE_MARGIN;
    const middleSectionLeft = leftSideLeft + LEFT_SIDE_WIDTH + CONSTANT_GAP - leftScaleOffset;
    const middleSectionRight = rightSideLeft - CONSTANT_GAP + rightScaleOffset;
    const middleSectionWidth = middleSectionRight - middleSectionLeft;

    return (
        <div className="bg-[#ECECEC] w-full min-h-[calc(100vh-72px)] text-[#454545]">
            <div className="flex justify-center">
                <div
                    className="relative max-w-[1320px] w-full"
                    ref={layoutRef}
                    style={{
                        width: '100%',
                        maxWidth: '1320px',
                        transition: 'width 0.2s',
                    }}
                >
                    <div
                        className="hidden lg:block fixed top-[86px] z-10"
                        style={{
                            width: `${LEFT_SIDE_WIDTH}px`,
                            left: `${leftSideLeft}px`,
                        }}
                        id="left-side"
                    >
                        <div className="transform scale-[0.92] origin-top h-full w-full">
                            <LeftSide/>
                        </div>
                    </div>

                    <div
                        className="hidden lg:block fixed top-[86px] z-10"
                        style={{
                            width: `${RIGHT_SIDE_WIDTH}px`,
                            left: `${rightSideLeft}px`,
                        }}
                        id="right-side"
                    >
                        <div className="transform scale-[0.92] origin-top h-full w-full">
                            <RightSide/>
                        </div>
                    </div>

                    <div
                        id="middle-section"
                        className="w-full min-h-[calc(100vh-108px)] mt-4 mb-[20px] flex flex-col justify-center transition-all duration-300 overflow-x-hidden px-2 sm:px-4 lg:px-6 "
                        style={
                            layoutWidth >= 1024
                                ? {
                                    marginLeft: `${middleSectionLeft - layoutLeft}px`,
                                    marginRight: `${layoutLeft + layoutWidth - middleSectionRight + scrollbarWidth}px`,
                                    width: `${middleSectionWidth}px`,
                                }
                                : {marginLeft: 0, marginRight: 0, width: '100%'}
                        }
                    >
                        <div
                            className="flex-grow min-w-0 w-full h-full flex flex-col overflow-hidden middle-section-content">
                            <Outlet/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;

