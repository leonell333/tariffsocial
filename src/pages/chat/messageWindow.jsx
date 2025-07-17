import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import {useDispatch, useSelector} from 'react-redux';
import {Check, Copy, FileArchive, Forward, Pin, Reply, Trash2, Users} from 'lucide-react';
import InputArea from './inputArea';
import defaultAvatar from '../../assets/images/logo2.png';
import {format, isSameDay} from 'date-fns';
import {
	deleteMessage,
	deleteMessages,
	getMessageHistoryWithUser,
	markMessagesAsRead,
	pinMessage,
	searchUsersByUsername,
	setForwardMessage,
	setReplyToMessage,
	toggleSelectMessage,
	updateChatStore,
	updateReaction
} from '../../store/actions/chatAction';

const MessageWindow = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const user = useSelector((state) => state.user);
	const chat = useSelector((state) => state.chat);
	const { users, searchUsers, selectedMessages = [] } = chat;
	const { dms, messages, selectedUserId, selectedUsers = [] } = chat;
	const [userListShow, setUserlistShow] = useState(false);
	const [searchKey, setSearchKey] = useState('');
	const [searching, setSearching] = useState(false);
	const [_previewMedia, setPreviewMedia] = useState(null);
	const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
	const messageBoxRef = useRef(null);
	const messageEndRef = useRef(null);
	const dropdownRef = useRef(null);

	const extractFileName = (url) => {
		try {
			const decodedUrl = decodeURIComponent(url);
			const segments = decodedUrl.split('/');
			const lastSegment = segments.pop() || '';
			const queryParamIndex = lastSegment.indexOf('?');
			const fileNameWithToken = queryParamIndex !== -1 ? lastSegment.substring(0, queryParamIndex) : lastSegment;
			const finalFileName = fileNameWithToken.split('%2F').pop();
			if (finalFileName) return finalFileName;
			return lastSegment;
		} catch (e) { 
			console.error("Failed to extract file name", e);
			return url.split('/').pop() || 'file';
		}
	}

	useEffect(() => {
		if (selectedUserId) {
			dispatch(markMessagesAsRead(selectedUserId));
		}
	}, [selectedUserId]);

	const handleReaction = (messageId, emoji, closeMenu = false) => {
		dispatch(updateReaction(messageId, emoji));
		if (closeMenu) setContextMenu((prev) => ({ ...prev, visible: false }));
	};

	const handleUserSelect = (user) => {
		const isInDms = dms.some(dm => dm.id === user.id);
		if (isInDms) {
			dispatch(updateChatStore({ selectedUserId: user.id, messages: [], lastMessage: null, lastMessageVisible: false }));
			dispatch(getMessageHistoryWithUser(user.id));
		} else {
			dispatch(updateChatStore({ selectedUserId: '', selectedUsers: [...selectedUsers, user.id], messages: [], lastMessage: null, lastMessageVisible: false }));
		}
		setUserlistShow(false);
	};

	// Context menu handlers
	const handleReply = (message) => {
		dispatch(setReplyToMessage(message));
		setContextMenu({ ...contextMenu, visible: false });
	};

	const handlePin = async (message) => {
		try {
			await dispatch(pinMessage(message.id));
			setContextMenu({ ...contextMenu, visible: false });
		} catch (error) {
			console.error('Failed to pin/unpin message:', error);
		}
	};

	const handleCopyText = (message) => {
		if (navigator && navigator.clipboard) {
			navigator.clipboard.writeText(message.message);
		} else {
			const textArea = document.createElement('textarea');
			textArea.value = message.message;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
		}
		setContextMenu({ ...contextMenu, visible: false });
	};

	const handleForward = (message) => {
		dispatch(setForwardMessage(message));
		setContextMenu({ ...contextMenu, visible: false });
	};

	const handleDelete = async (message) => {
		try {
			await dispatch(deleteMessage(message.id));
			setContextMenu((prev) => ({ ...prev, visible: false }));
    } catch (error) {
			console.error('Failed to delete message:', error);
		}
	};

	const handleSelect = (message) => {
		dispatch(toggleSelectMessage(message.id));
		setContextMenu({ ...contextMenu, visible: false });
		const isSelected = selectedMessages.includes(message.id);
	};

	useEffect(() => {
		const timeout = setTimeout(() => {
			messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
		}, 100);
		return () => clearTimeout(timeout);
	}, [messages.length, selectedUserId]);

	const renderMessageContent = (msg, dateObj, isMe) => {
		switch (msg.messageType) {
			case 'gif':
			case 'image':
				return (
					<div className="relative group">
						<img
							src={msg.message}
							alt={msg.messageType}
							className="max-w-[300px] rounded-lg"
							onClick={() => setPreviewMedia({ src: msg.message, type: msg.messageType })}
						/>
						<div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
							{dateObj ? format(dateObj, 'h:mm a') : ''}
							{isMe && (
								<>
									{msg.read === 1 ? (
										<>
											<svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 13.5l6 6L22.5 4.5l-1.5-1.5L7.5 16.5l-4.5-4.5z"/></svg>
											<svg className="w-3 h-3 -ml-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 13.5l6 6L22.5 4.5l-1.5-1.5L7.5 16.5l-4.5-4.5z"/></svg>
										</>
									) : (
										<svg className="w-3 h-3 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 13.5l6 6L22.5 4.5l-1.5-1.5L7.5 16.5l-4.5-4.5z"/></svg>
									)}
								</>
							)}
						</div>
					</div>
				);
			case 'emoji':
				return <span className="text-2xl">{msg.message}</span>;
			case 'file':
				{ const fileName = extractFileName(msg.message);
				return (
					<div className="flex items-center gap-3">
						<div className={`p-3 rounded-lg ${isMe ? 'bg-white/20' : 'bg-gray-200'}`}>
							<FileArchive size={24} className={`${isMe ? 'text-white' : 'text-gray-600'}`} />
						</div>
						<a
							href={msg.message}
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium pr-2"
						>
							{fileName}
						</a>
					</div>
				); }
			default:
				return <div className="inline">{msg.message}</div>;
		}
	};

	useEffect(() => {
		if (!searchKey.trim()) return;
		const delay = setTimeout(() => {
			dispatch(updateChatStore({
				searchUsers: [],
				lastSearchUser: null,
				lastSearchUserVisible: false
			}));
			dispatch(searchUsersByUsername(searchKey.trim()))
				.then((res) => {
					if (res) setSearching(!searching);
				})
				.catch(err => {
					console.error('Search error:', err);
					setSearching(!searching);
				});
		}, 500);
		return () => clearTimeout(delay);
	}, [searchKey]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target) &&
				!event.target.closest('.reaction-menu')
			) {
				setUserlistShow(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (!messageBoxRef.current) return;
		const images = messageBoxRef.current.querySelectorAll('img');
		if (images.length === 0) return;
		let loadedCount = 0;
		const handleLoad = () => {
			loadedCount += 1;
			if (loadedCount === images.length) {
				messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
			}
		};
		images.forEach((img) => {
			if (img.complete) {
				handleLoad();
			} else {
				img.onload = handleLoad;
				img.onerror = handleLoad;
			}
		});
		return () => {
			images.forEach((img) => {
				img.onload = null;
				img.onerror = null;
			});
		};
	}, [messages.length, selectedUserId]);

	useEffect(() => {
		const handleClick = () => setContextMenu((prev) => ({ ...prev, visible: false }));
		const handleKeyDown = (e) => {
			if (e.key === 'Escape') {
				setContextMenu((prev) => ({ ...prev, visible: false }));
			}
		};
		
		if (contextMenu.visible) {
			window.addEventListener('click', handleClick);
			window.addEventListener('keydown', handleKeyDown);
		}
		return () => {
			window.removeEventListener('click', handleClick);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [contextMenu.visible]);

	// Handle context menu positioning
	const handleContextMenu = (e, message) => {
		e.preventDefault();
		const rect = e.currentTarget.getBoundingClientRect();
		const menuWidth = 180;
		const menuHeight = 200;
		
		let x = e.clientX;
		let y = e.clientY;
		
		// Ensure menu stays within viewport
		if (x + menuWidth > window.innerWidth) {
			x = window.innerWidth - menuWidth - 10;
		}
		if (y + menuHeight > window.innerHeight) {
			y = window.innerHeight - menuHeight - 10;
		}
		
		setContextMenu({
			visible: true,
			x,
			y,
			message,
		});
	};

	return (
		<div className="flex-1 flex flex-col min-w-0 bg-white rounded-[10px] max-h-[649px] overflow-hidden">
			<div className="bg-white border-b border-gray-200 py-2 px-4 flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<img
						src={user?.photoUrl}
						alt={user?.username || 'User'}
						className="h-11 w-11 rounded-full object-cover cursor-pointer"
						onClick={() => navigate('/profile/' + user?.id)}
					/>
					<div>
						<h1 className="text-lg font-semibold text-gray-900">{user?.username || 'Anonymous'}</h1>
						<p className="text-sm text-gray-500"></p>
					</div>
				</div>

				<div className="relative inline-block text-left" ref={dropdownRef}>
					<button
						onClick={() => setUserlistShow(!userListShow)}
						className={`p-2 rounded-full focus:outline-none ${userListShow ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}
						aria-label="Toggle user list"
					>
						<Users size={20} className="h-5 w-5" />
					</button>

					{userListShow && (
						<div className="absolute right-0 mt-2 w-[208px] max-h-[300px] overflow-x-hidden overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-md z-50 custom-scrollbar">
							<div className="p-2 border-b border-gray-200">
								<input
									type="text"
									value={searchKey}
									onChange={(e) => {
										setSearchKey(e.target.value);
										setSearching(!searching);
									}}
									placeholder="Search users..."
									className="w-full px-3 py-1 text-sm bg-gray-100 text-black rounded-md focus:outline-none"
								/>
							</div>

							{(searchKey.trim() ? searchUsers : users).length === 0 ? (
								!searching && <div className="p-4 text-sm text-gray-500">No users found</div>
							) : (
								(searchKey.trim() ? searchUsers : users).map((user) => (
									<div
										key={user.id}
										className="flex items-center gap-3 p-2 pt-1 hover:bg-gray-100 cursor-pointer"
										onClick={() => handleUserSelect(user)}
									>
										<img
											src={user.photoUrl || defaultAvatar}
											alt={user.username}
											className="h-7 w-7 rounded-full object-cover"
										/>
										<div className="text-sm text-gray-900 truncate">{user.username}</div>
									</div>
								))
							)}
						</div>
					)}
				</div>
			</div>

			<div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-h-[588px]">
				{/* Top action bar for selected messages */}
				{selectedMessages.length > 0 && (
					<div className="flex items-center justify-between px-4 py-2 bg-[#23272f] border-b border-gray-700">
						<div className="flex gap-2">
							<button
								className="bg-teal-500 text-white px-2 py-1 rounded text-sm cursor-pointer"
								onClick={() => {
									// Forward the first selected message (multi-forward not implemented)
									const msg = messages.find(m => m.id === selectedMessages[0]);
									if (msg) dispatch(setForwardMessage(msg));
								}}
							>
								FORWARD {selectedMessages.length}
							</button>
							<button
								className="bg-teal-500 text-white px-2 py-1 rounded text-sm cursor-pointer"
								onClick={async () => {
									if (selectedMessages.length > 0) {
										await dispatch(deleteMessages(selectedMessages));
									}
								}}
							>
								DELETE {selectedMessages.length}
							</button>
						</div>
						<button
							className="text-teal-400 text-sm cursor-pointer"
							onClick={() => dispatch(updateChatStore({ selectedMessages: [] }))}
						>
							CANCEL
						</button>
					</div>
				)}
				<div ref={messageBoxRef} className="flex-1 overflow-x-hidden overflow-y-auto p-4 transition-all duration-300 custom-scrollbar">
					{messages.filter(msg => msg.pinned).length > 0 && (
						<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<div className="flex items-center gap-2 mb-2">
								<Pin size={16} className="text-yellow-600" />
								<span className="text-sm font-medium text-yellow-800">Pinned Messages</span>
							</div>
							<div className="space-y-2">
								{messages.filter(msg => msg.pinned).map((msg, index) => (
									<div key={`pinned-${msg.id}`} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
										<div className="font-medium">{msg.from === user.id ? 'You' : 'Other'}</div>
										<div className="truncate">{msg.message}</div>
									</div>
								))}
							</div>
						</div>
					)}
					{messages.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-gray-500">
							{/* <CheckCircle2 size={48} className="mb-2 text-indigo-500" /> */}
							{/* <p className="text-lg font-medium">No messages yet</p>
							<p className="text-sm">Be the first to start the conversation!</p> */}
						</div>
					) : (
						<>
							{messages.map((msg, i) => {
								const isMe = msg.from === user.id;
								const noBg = msg.messageType === 'emoji' || msg.messageType === 'image' || msg.messageType === 'gif';
								const isSelected = selectedMessages.includes(msg.id);
								const isPinned = msg.pinned;

								let dateObj;
								if (msg.timestamp instanceof Date) {
									dateObj = msg.timestamp;
								} else if (msg.timestamp?.toDate) {
									dateObj = msg.timestamp.toDate();
								} else if (typeof msg.timestamp === 'string') {
									dateObj = new Date(msg.timestamp);
								}

								let showDate = false;
								if (i === 0) {
									showDate = true;
								} else {
									let prevDateObj;
									const prevMsg = messages[i - 1];
									if (prevMsg.timestamp instanceof Date) {
										prevDateObj = prevMsg.timestamp;
									} else if (prevMsg.timestamp?.toDate) {
										prevDateObj = prevMsg.timestamp.toDate();
									} else if (typeof prevMsg.timestamp === 'string') {
										prevDateObj = new Date(prevMsg.timestamp);
									}
									if (dateObj && prevDateObj) {
										showDate = !isSameDay(dateObj, prevDateObj);
									}
								}

								return (
									<React.Fragment key={msg.id || i}>
										{showDate && dateObj && (
											<div className="flex justify-center my-1">
												<span className="text-xs font-semibold text-gray-500 tracking-wider">
													{format(dateObj, 'MMM d, yyyy').toUpperCase()}
												</span>
											</div>
										)}
										<div className={`flex flex-col mb-2 ${isMe ? 'items-end' : 'items-start'}`}>
											<div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
												<div className="flex items-center justify-center gap-2">
													<div
														className={`w-fit max-w-lg rounded-xl ${
															noBg
																? ''
																: `px-3 py-1.5 ${isMe ? 'bg-[#0084FF] text-white' : 'bg-gray-200 text-black'}`
														}`}
														onContextMenu={(e) => {
															e.preventDefault();
															handleContextMenu(e, msg);
														}}
													>
                            <div className="break-words">
                              {renderMessageContent(msg, dateObj, isMe)}
                              {(msg.messageType !== 'image' && msg.messageType !== 'gif') && (
                                <div className="inline-flex items-center gap-1 float-right ml-2 mt-1.5">
                                  <span className={`text-xs ${isMe && !noBg ? 'text-gray-200' : 'text-gray-600'}`}>
                                    {dateObj ? format(dateObj, 'h:mm a') : ''}
                                  </span>
                                  {isMe && (
                                    <>
                                      {msg.read === 1 ? (
                                        <>
                                          <svg className={`w-3 h-3 ${!noBg ? 'text-white' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 13.5l6 6L22.5 4.5l-1.5-1.5L7.5 16.5l-4.5-4.5z"/></svg>
                                          <svg className={`w-3 h-3 -ml-3 ${!noBg ? 'text-white' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 13.5l6 6L22.5 4.5l-1.5-1.5L7.5 16.5l-4.5-4.5z"/></svg>
                                        </>
                                      ) : (
                                        <svg className={`w-3 h-3 ${!noBg ? 'text-gray-300' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 13.5l6 6L22.5 4.5l-1.5-1.5L7.5 16.5l-4.5-4.5z"/></svg>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
													</div>
													{isSelected && (
														<div className={`bg-[#0084FF] border-1 border-white rounded-full w-4 h-4 flex items-center justify-center z-20 ${isMe ? 'right-[-28px]' : 'left-[-28px]'}`}>
															<Check size={14} className="text-white" />
														</div>
													)}
												</div>
											</div>
										</div>
										{msg.reactions && msg.reactions.length > 0 && (
											<div className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
												{Object.entries(
													msg.reactions.reduce((acc, r) => {
														acc[r.emoji] = acc[r.emoji] || [];
														acc[r.emoji].push(r.userId);
														return acc;
													}, {})
												).map(([emoji, userIds]) => (
													<span
														key={emoji}
														className={`inline-flex items-center px-1 py-0.5 text-sm font-medium cursor-pointer select-none transition`}
														onClick={() => handleReaction(msg.id, emoji, true)}
													>
														{emoji} <span className="ml-1">{userIds.length}</span>
													</span>
												))}
											</div>
										)}
									</React.Fragment>
								);
							})}
							<div ref={messageEndRef} />
						</>
					)}
				</div>

				{contextMenu.visible && (
					<div
						className="fixed z-50 bg-[#23272f] text-white rounded-lg shadow-lg border border-gray-700"
						style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 180 }}
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex px-2 py-1 border-b border-gray-600 gap-1 text-xl">
							<button className="hover:bg-gray-600 rounded p-1" onClick={() => handleReaction(contextMenu.message.id, '❤️', true)}>❤️</button>
							<button className="hover:bg-gray-600 rounded p-1" onClick={() => handleReaction(contextMenu.message.id, '👍', true)}>👍</button>
							<button className="hover:bg-gray-600 rounded p-1" onClick={() => handleReaction(contextMenu.message.id, '👏', true)}>👏</button>
							<button className="hover:bg-gray-600 rounded p-1" onClick={() => handleReaction(contextMenu.message.id, '👎', true)}>👎</button>
							<button className="hover:bg-gray-600 rounded p-1" onClick={() => handleReaction(contextMenu.message.id, '🔥', true)}>🔥</button>
							<button className="hover:bg-gray-600 rounded p-1" onClick={() => handleReaction(contextMenu.message.id, '🥰', true)}>🥰</button>
						</div>
						<div className="flex flex-col py-1">
							<button 
								className="flex items-center gap-2 px-4 py-2 hover:bg-[#2c313a] text-left cursor-pointer"
								onClick={() => handleReply(contextMenu.message)}
							>
								<Reply size={18} /> Reply
							</button>
							<button 
								className="flex items-center gap-2 px-4 py-2 hover:bg-[#2c313a] text-left cursor-pointer"
								onClick={() => handlePin(contextMenu.message)}
							>
								<Pin size={18} /> {contextMenu.message?.pinned ? 'Unpin' : 'Pin'}
							</button>
							<button 
								className="flex items-center gap-2 px-4 py-2 hover:bg-[#2c313a] text-left cursor-pointer"
								onClick={() => handleCopyText(contextMenu.message)}
							>
								<Copy size={18} /> Copy Text
							</button>
							<button 
								className="flex items-center gap-2 px-4 py-2 hover:bg-[#2c313a] text-left cursor-pointer"
								onClick={() => handleForward(contextMenu.message)}
							>
								<Forward size={18} /> Forward
							</button>
							<button 
								className="flex items-center gap-2 px-4 py-2 hover:bg-[#2c313a] text-left text-red-400 cursor-pointer"
								onClick={() => handleDelete(contextMenu.message)}
							>
								<Trash2 size={18} /> Delete
							</button>
							<button 
								className={`flex items-center gap-2 px-4 py-2 hover:bg-[#2c313a] text-left cursor-pointer ${selectedMessages.includes(contextMenu.message?.id) ? 'bg-[#2c313a] text-blue-400' : ''}`}
								onClick={() => handleSelect(contextMenu.message)}
							>
								<Check size={18} /> {selectedMessages.includes(contextMenu.message?.id) ? 'Deselect' : 'Select'}
							</button>
						</div>
					</div>
				)}

				<div className="shrink-0">
					<InputArea />
				</div>
			</div>
		</div>
	);
};

export default MessageWindow;