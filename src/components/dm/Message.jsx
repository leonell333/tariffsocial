
import React, { useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Modal from '@mui/material/Modal'
import { Avatar } from '@mui/material'
import { sendMessageToSelectedUser } from '../../store/actions/chatAction'
import { updateBaseStore } from '../../store/actions/baseActions'

const Message = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const base = useSelector((state) => state.base);
  const { messageModal } = base;
  const [content, setContent] = useState('')
  const selectedUser = user.selectedUser;

  const handleSend = () => {
    if (!content.trim() || !selectedUser) return;
    dispatch(sendMessageToSelectedUser(content))
      .then((res) => {
        if (res) {
          setContent('');
          dispatch(updateBaseStore({ messageModal: false }));
        }
      }).catch((error) => {
        console.error('Failed to send message:', error);
      });
  }

  return (
    <Modal
      open={messageModal}
      className="flex items-center justify-center p-4"
      onClose={() => dispatch(updateBaseStore({ messageModal: !messageModal }))}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      disableScrollLock={true}
      style={{ zIndex: 1000 }}
      BackdropProps={{
        style: { 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999
        }
      }}>
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 ease-out" style={{ zIndex: 1001 }}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg font-semibold">
              Send Message
            </h3>
            <button
              onClick={() => dispatch(updateBaseStore({ messageModal: false }))}
              className="text-white hover:text-gray-200 transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar 
                src={selectedUser?.photoUrl} 
                sx={{ width: 48, height: 48 }}
                className="ring-2 ring-white shadow-lg"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">To: {selectedUser?.username}</p>
              <p className="text-xs text-gray-500">Direct Message</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="relative">
            <textarea
              id="content_textarea"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none resize-none transition-all duration-200 placeholder-gray-400 text-gray-700 custom-scrollbar"
              value={content}
              placeholder="Type your message here..."
              rows={4}
              onChange={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
                setContent(e.target.value)
              }}
              style={{
                outline: 'none',
                border: '1px solid #e5e7eb',
                boxShadow: 'none'
              }}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {content.length}/500
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex space-x-3">
          <button
            onClick={() => dispatch(updateBaseStore({ messageModal: false }))}
            className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 transform hover:scale-105">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!content.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-center space-x-2">
              {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg> */}
              <span>Send</span>
            </div>
          </button>
        </div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full opacity-20"></div>
        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-400 rounded-full opacity-20"></div>
      </div>
    </Modal>
  )
}

export default Message;
