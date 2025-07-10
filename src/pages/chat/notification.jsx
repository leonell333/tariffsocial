
import { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getNotifications, markNotificationAsRead, deleteNotification } from '../../store/actions/baseActions'
import { toast } from 'react-toastify'
import { Trash2, Check, Bell } from 'lucide-react'
import Comment from '../../components/post/comment'
import Post from '../../components/post/post'

const Notification = () => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  const { notifications, lastNotificationVisible } = useSelector(state => state.base)
  const { loading } = useSelector(state => state.base)
  const lastScrollY = useRef(0)

  const fetchNotifications = async (reset = false) => {
    if (!user?.id) return
    try {
      await dispatch(getNotifications(reset))
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const loadMoreNotifications = async () => {
    if (loading || lastNotificationVisible) return
    try {
      await dispatch(getNotifications())
    } catch (error) {
      console.error('Error loading more notifications:', error)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markNotificationAsRead(notificationId))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      await dispatch(deleteNotification(notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getSenderInfo = (notification) => {
    if (notification.type === 'site') {
      return {
        name: 'Tariff Social',
        photo: '/src/assets/images/logo.webp'
      }
    } else if (notification.type === 'notify') {
      return {
        name: notification.username || 'System',
        photo: notification.userPhoto || '/src/assets/images/default.png'
      }
    }
    return {
      name: 'Unknown',
      photo: '/src/assets/images/default.png'
    }
  }

  const getExactTime = (timestamp) => {
    if (!timestamp) return 'Unknown time'
    let date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }
    
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const isScrollingDown = scrollTop > lastScrollY.current
      if (
        isScrollingDown &&
        window.innerHeight + scrollTop >= document.body.offsetHeight - 100 &&
        !loading &&
        !lastNotificationVisible
      ) {
        loadMoreNotifications()
      }
      lastScrollY.current = scrollTop
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, lastNotificationVisible])

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(true)
    }
  }, [user?.id])

  return (
    <div className="w-full bg-white shadow-lg min-h-[calc(100vh-107px)] rounded-xl p-6 text-black space-y-4" style={{ fontFamily: 'poppins' }}>
      <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
        <div className="p-2 bg-gray-50 rounded-full">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>
      </div>

      <div className="space-y-2"> 
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-gray-500 text-lg font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const senderInfo = getSenderInfo(notification)
            return (
              <div 
                key={notification.id || index} 
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  notification.read === 0 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 ring-2 ring-white shadow-sm">
                      <img
                        src={senderInfo.photo}
                        alt={senderInfo.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/src/assets/images/default.png'
                        }}
                      />
                    </div>
                    {notification.read === 0 && (
                      <div className="absolute bottom-1 right-0 w-3 h-3 rounded-full border border-white bg-green-500"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 truncate">{senderInfo.name}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {getExactTime(notification.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {notification.message}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {notification.read === 0 && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {lastNotificationVisible && notifications.length > 0 && (
          <div className="text-center py-2">
            <p className="text-gray-300 text-xs">No more notifications to load</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notification;
