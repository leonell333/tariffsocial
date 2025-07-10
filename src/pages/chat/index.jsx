import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { HomeIcon, CheckCircle2, Ban, Unlock, Lock, Trash2, XIcon } from 'lucide-react'
import { Separator } from "../../components/ui/separator";
import defaultAvatar from '../../assets/images/logo2.png';
import RightSide from '../layout/rightSide'
import { toast } from 'react-toastify';
import DirectMessageWindow from './directMessageWindow';
import MessageWindow from './messageWindow';
import { getDms, getPendingDms, initialChatStore, updateChatStore, getMessageHistoryWithUser, getPendingDmsCount, handleDmAccept, 
  handleDmBlock, handleDmUnblock, handleDmIgnore, handleDeleteDM, getUnreadMessagesCountPerUser, markMessagesAsRead } from '../../store/actions/chatAction';
import { readTime } from '../../utils'
import { Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Chat = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const chat = useSelector((state) => state.chat);
  const { dms, pendingDms, pendingDmsCount, selectedUserId } = chat;
  const [showPending, setShowPending] = useState(false);
  const layoutRef = useRef(null);
  const [layoutLeft, setLayoutLeft] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(1320);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, user: null, type: null, });
  
  const LEFT_SIDE_WIDTH = 250;
  const RIGHT_SIDE_WIDTH = 300;
  const SIDE_MARGIN = 70;
  const CONSTANT_GAP = 0;
  const SCALE = 0.92;

  useEffect(() => {
    dispatch(initialChatStore());
    Promise.allSettled([
      dispatch(getDms()),
      dispatch(getPendingDmsCount()),
    ]).then(() => {
      dispatch(getUnreadMessagesCountPerUser());
    });

    let unsubscribe = null;
    const { id: userId } = user || {};
    if (!userId) return;
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('to', '==', userId),
      where('read', '==', 0),
      where('type', 'in', ['DM', 'message'])
    );
    unsubscribe = onSnapshot(q, async (snapshot) => {
      const unreadBySender = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.from) return;
        unreadBySender[data.from] = (unreadBySender[data.from] || 0) + 1;
      });
      dispatch(async (dispatch, getState) => {
        const { chat, user } = getState();
        let dms = chat.dms || [];
        let pendingDms = chat.pendingDms || [];
        const updateUnread = (list, missingSenders) =>
          list.map(dm => {
            const partnerId = dm.partnerId || dm.id;
            if (unreadBySender.hasOwnProperty(partnerId)) {
              if (dm.unreadCount !== unreadBySender[partnerId]) {
                return { ...dm, unreadCount: unreadBySender[partnerId] };
              }
              delete unreadBySender[partnerId];
            }
            return dm;
          });
        dms = updateUnread(dms, unreadBySender);
        pendingDms = updateUnread(pendingDms, unreadBySender);
        const allExistingIds = new Set([
          ...dms.map(dm => dm.partnerId || dm.id),
          ...pendingDms.map(dm => dm.partnerId || dm.id)
        ]);
        const newSenderIds = Object.keys(unreadBySender).filter(
          id => !allExistingIds.has(id)
        );
        if (newSenderIds.length > 0) {
          const { getDoc, doc } = await import('firebase/firestore');
          const userDocs = await Promise.all(newSenderIds.map(id => getDoc(doc(db, 'users', id))));
          const newDms = userDocs.map((snap, idx) => {
            const data = snap.exists() ? snap.data() : {};
            return {
              id: newSenderIds[idx],
              partnerId: newSenderIds[idx],
              username: data.username || 'Unknown',
              photoUrl: data.photoUrl || '',
              unreadCount: unreadBySender[newSenderIds[idx]],
              lastTime: new Date(),
              state: 'show',
            };
          });
          dms = [...dms, ...newDms];
        }
        dispatch(updateChatStore({
          dms,
          pendingDms,
        }));
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleShowPending = () => {
    dispatch(getPendingDms()).then((res) => {
      if (res) {
        setShowPending(!showPending)
        dispatch(getUnreadMessagesCountPerUser());
      }
      }).catch(err => console.error('Failed to load DMs:', err));
  }
  
  const handleSelectUser = (user) => {
    if (!user?.id) return;
    if (selectedUserId === user.id) {
      dispatch(updateChatStore({
        selectedUserId: "",
        messages: [],
        lastMessage: null,
        lastMessageVisible: false,
      }));
      return;
    }
    dispatch(updateChatStore({
      selectedUserId: user.id,
      messages: [],
      lastMessage: null,
      lastMessageVisible: false,
    }));
    dispatch(getMessageHistoryWithUser(user.id))
      .then(() => dispatch(markMessagesAsRead(user.id)))
      .then(() => dispatch(getUnreadMessagesCountPerUser()))
      .catch((err) => {
        console.error('Failed to select user or load messages:', err);
      });
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
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const leftScaleOffset = (LEFT_SIDE_WIDTH * (1 - SCALE)) / 2;
  const rightScaleOffset = (RIGHT_SIDE_WIDTH * (1 - SCALE)) / 2;
  const leftSideLeft = layoutLeft + SIDE_MARGIN;
  const rightSideLeft = layoutLeft + layoutWidth - RIGHT_SIDE_WIDTH - SIDE_MARGIN;
  const middleSectionLeft = leftSideLeft + LEFT_SIDE_WIDTH + CONSTANT_GAP - leftScaleOffset;
  const middleSectionRight = rightSideLeft - CONSTANT_GAP + rightScaleOffset;
  const middleSectionWidth = middleSectionRight - middleSectionLeft;

  const handleAcceptClick = (dmUser) => {
    dispatch(handleDmAccept(dmUser))
      .then((res) => {
        if (res) {
          toast.success('DM request accepted successfully!');
        } else {
          toast.warn('Failed to accept DM request.');
        }
      }).catch((err) => {
        console.error('Error while accepting DM request:', err);
      });
  };

  const handleBlockClick = (dmUser) => {
    dispatch(handleDmBlock(dmUser))
      .then((res) => {
        if (res) {
          toast.success('User blocked successfully.');
        } else {
          toast.warn('Failed to block user.');
        }
      })
      .catch((err) => {
        console.error('Block failed:', err);
        toast.error('An error occurred.');
      });
  };

  const handleIgnoreClick = (dmUser) => {
    dispatch(handleDmIgnore(dmUser))
      .then((res) => {
        if (res) {
          toast.success('User ignored successfully.');
        } else {
          toast.warn('Failed to ignore user.');
        }
      })
      .catch((err) => {
        console.error('Ignore failed:', err);
        toast.error('An error occurred while ignoring.');
      });
  };

  const handleUnblockClick = (dm) => {
    dispatch(handleDmUnblock(dm))
      .then((res) => {
        if (res) {
          toast.success('User unblocked successfully.');
        } else {
          toast.warn('Failed to unblock user.');
        }
      })
      .catch((err) => {
        console.error('Unblock failed:', err);
        toast.error('An error occurred.');
      });
  };

  const handleDeleteDMClick = (dmUserId) => {
    dispatch(handleDeleteDM(dmUserId))
      .then((res) => {
        if (res) {
          toast.success("User deleted successfully")
        } else {
          console.log('No DM deleted (maybe invalid ID)');
        }
      }).catch((err) => {
        console.error('Error deleting DM:', err);
      });
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const ChatLeftSide = () => (
    <div className="bg-white p-[10px] rounded-xl flex flex-col overflow-hidden h-[706px]">
      <section className="flex flex-col w-full max-w-[305px] items-start gap-[5px] flex-1 min-h-0 overflow-hidden">
        <header className="flex items-center justify-between w-full py-2 border-b">
          <div className="w-full flex items-center gap-2 px-2 py-[5.5px] rounded-md cursor-pointer hover:bg-gray-100"
            onClick={() => { navigate("/")}}>
            <HomeIcon className="text-[#666]" size={28} />
            <span className="text-[18px] text-[#333] ml-3" style={{fontFamily: "poppins"}}>Home</span>
          </div>
        </header>

        <div
          className="flex items-center justify-between w-full px-3 py-2 border-b border-[#EBEBEB] cursor-pointer hover:bg-gray-100 transition"
          onClick={handleShowPending}
        >
          <h2 className={`text-sm font-medium ${showPending ? 'text-yellow-600' : 'text-gray-800'}`}>
            {showPending ? "Pending Requests" : "Direct messages"}
          </h2>

          <button onClick={handleShowPending}
            className="relative w-[22px] h-[22px] flex items-center justify-center cursor-pointer ml-auto"
            title={showPending ? "Show Direct Messages" : "Show Pending Requests"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884l8 4.8a1 1 0 001.006 0l8-4.8A1 1 0 0018 4H2a1 1 0 00.003 1.884z" />
              <path d="M18 8.118l-8 4.8-8-4.8V14a1 1 0 001 1h14a1 1 0 001-1V8.118z" />
            </svg>
            {pendingDmsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                {pendingDmsCount}
              </span>
            )}
          </button>
        </div>

        <div className="w-full flex-1 overflow-y-auto custom-scrollbar">
          {(showPending ? pendingDms : dms).map((dm, index) => (
            <div key={dm.id || index}>
              <div
                onClick={() => handleSelectUser(dm)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    visible: true,
                    x: e.pageX,
                    y: e.pageY,
                    user: dm,
                    type: showPending ? 'pending' : 'dms',
                  });
                }}
                className={`p-1 pb-0 transition-colors duration-150 cursor-pointer rounded-md
                  ${selectedUserId === dm.id ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={dm.photoUrl || defaultAvatar}
                      alt={dm.username}
                      className="h-10 w-10 rounded-full object-cover border-2 border-white"
                    />
                    {['online', 'offline'].includes(dm.status) && (
                      <span
                        className={`absolute bottom-2 right-1 w-3 h-3 rounded-full border border-white ${
                          dm.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      ></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{dm.username}</h4>
                      <span
                        className={`text-xs ${
                          dm.status === 'online'
                            ? 'text-emerald-500'
                            : dm.status === 'away'
                            ? 'text-amber-500'
                            : 'text-gray-400'
                        }`}
                      >
                        {readTime(dm.lastTime ? dm.lastTime : new Date(Date.now()))}
                      </span>
                      {dm.unreadCount > 0 && (
                        <span className="w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                          {dm.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-1 bg-[#E9E5DF]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <>
      <div className="bg-[#ECECEC] w-full text-[#454545]" style={{ minHeight: 'calc(100vh - 72px)' }}>
        {layoutWidth >= 1024 && (
          <div
            className="fixed top-[86px] h-[calc(100vh-70px)] z-10"
            style={{
              width: `${LEFT_SIDE_WIDTH}px`,
              left: `${leftSideLeft}px`,
            }}
            id="left-side"
          >
            <div className="transform scale-[0.92] origin-top h-full w-full">
              <ChatLeftSide />
            </div>
          </div>
        )}

        {layoutWidth >= 1024 && (
          <div
            className="fixed top-[86px] h-[calc(100vh-70px)] z-10"
            style={{
              width: `${RIGHT_SIDE_WIDTH}px`,
              left: `${rightSideLeft}px`,
            }}
            id="right-side"
          >
            <div className="transform scale-[0.92] origin-top h-full w-full">
              <RightSide />
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="w-full max-w-[1320px] relative" ref={layoutRef}>
            <div
              id="middle-section"
              className="mt-4 flex flex-col justify-center transition-all duration-300 overflow-x-hidden px-4 sm:px-6 lg:w-full"
              style={
                layoutWidth >= 1024
                  ? {
                      marginLeft: `${middleSectionLeft - layoutLeft}px`,
                      marginRight: `${layoutLeft + layoutWidth - middleSectionRight}px`,
                      width: `${middleSectionWidth}px`,
                    }
                  : { marginLeft: 0, marginRight: 0, width: '100%' }
              }
            >
              <div className="block lg:hidden mb-6">
                <RightSide />
              </div>

              <div className="flex-grow min-w-0 w-full flex flex-col overflow-hidden middle-section-content">
                {selectedUserId ? <MessageWindow /> : <DirectMessageWindow />}
              </div>
            </div>
          </div>
        </div>
        
        {contextMenu.visible && contextMenu.user && (
          <div
            className="fixed z-[9999] bg-white shadow-lg rounded-lg border border-gray-300"
            style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 180 }}
            onClick={() => setContextMenu({ ...contextMenu, visible: false })}
          >
            
            <div
              className="p-2 flex items-center gap-3 border-b border-gray-200 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/profile/' + contextMenu.user.partnerId);
              }}
            >
              <img
                src={contextMenu.user.photoUrl || defaultAvatar}
                alt={contextMenu.user.username}
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-gray-900 truncate">
                {contextMenu.user.username}
              </span>
            </div>
            
            <div className="flex flex-col">
              {contextMenu.type === 'pending' && (
                <>
                  <button
                    onClick={() => handleAcceptClick(contextMenu.user)}
                    className="hover:bg-gray-100 px-4 py-2 text-left flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Accept user
                  </button>
                  <button
                    onClick={() => handleIgnoreClick(contextMenu.user)}
                    className="hover:bg-gray-100 px-4 py-2 text-left flex items-center gap-2"
                  >
                    <Ban size={18} /> Ignore user
                  </button>
                </>
              )}
              <button
                onClick={() => handleBlockClick(contextMenu.user)}
                className="hover:bg-gray-100 px-4 py-2 text-left flex items-center gap-2"
              >
                <Lock size={18} /> Block user
              </button>
              <button
                onClick={() => handleUnblockClick(contextMenu.user)}
                className="hover:bg-gray-100 px-4 py-2 text-left flex items-center gap-2"
              >
                <Unlock size={18} /> Unblock user
              </button>
              <button
                onClick={() => {handleDeleteDMClick(contextMenu.user.id)}}
                className="hover:bg-gray-100 px-4 py-2 text-left flex items-center gap-2 text-red-500"
              >
                <Trash2 size={18} /> Delete user
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Chat;