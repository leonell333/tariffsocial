import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { toast } from 'react-toastify'

const ADMIN_USER_ID = ['b3DwQYxJSuYfIsA7EnPLyB9Z9Tv1', 'xq8z8E0hCYeInQ9RsSiFHaytQgC3'];

const Contact = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
  })
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user.id) { return; }
    try {
      await Promise.all(
        ADMIN_USER_ID.map(adminId =>
          addDoc(collection(db, 'messages'), {
            from: user.id,
            username: user.username,
            to: adminId,
            action: 'send',
            type: 'notify',
            messageType: 'text',
            message: formData.message,
            read: 0,
            timestamp: serverTimestamp(),
            userPhoto: user.photoUrl
          })
        )
      );
      setFormData({ name: '', message: '' })
      toast.success(
        'Thank you! Your message has been sent to the administrators.'
      )
    } catch (error) {
      console.log(error)
      toast.error('Failed to send message. Please try again.')
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-108px)] bg-white rounded-xl p-6 text-black space-y-6" style={{ fontFamily: 'poppins' }}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Contact Us</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your name"
            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Enter your message here..."
            className="mt-1 w-full p-2 border border-gray-300 rounded-md"></textarea>
        </div>

        <button 
          disabled={!user.id}
          type="submit"
          className={`px-4 py-2 rounded-[6px] ${
            user.id 
              ? 'bg-[#0e2841] text-white hover:bg-[#1c3b63] cursor-pointer' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}>
          Send Message
        </button>
      </form>
    </div>
  )
}

export default Contact;
