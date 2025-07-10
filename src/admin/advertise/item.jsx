import { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import {
  MessageCircle,
  Bookmark,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Heart,
  Laugh,
} from 'lucide-react'
import { db, storage, storageBucket } from '../../firebase'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import {
  updatePostStore,
} from '../../store/actions/postActions'
import $ from 'jquery'
import CountryFlag from 'react-country-flag'
import { sendRequest } from '../../utils/utils'
// import { countries } from "react-country-flag-select";

const AdItem = (props) => {
  const [data, setData] = useState({ ...props })
  let serverTime = props.serverTime?props.serverTime:new Date()
  const [imageUrl, setImageUrl] = useState('')
  const signin_email = props.user.email
  const { id, useremail, state, createdAt, expire } = props

 

  const handlePublic = () => {
    let expire = new Date(serverTime)
    expire.setDate(expire.getDate() + 7)
    const ad = doc(db, 'ads', id)
    updateDoc(ad, { expire, state: 'public' }).then((res) => {
      // console.log(expire);
      setData({ ...data, expire, state: 'public' })
      sendRequest('/cron/send_email', 'POST', {
        email: data.email,
        subject: 'Advertisement was published.',
        text: `Your advertisement what was created at ${data.createdAt} was publised.`,
        html: `Your advertisement what was created at ${data.createdAt} was publised.`,
      })
    })
  }
  

  if (!imageUrl) {
    const gsReference = ref(storage, 'gs://' + storageBucket + '/ads/' + id)
    getDownloadURL(gsReference)
      .then((url) => {
        setImageUrl(url)
      })
      .catch((error) => {
        // Handle any errors
      })
  }

  return (
    <>
      <div className="flex flex-col md:flex-row w-full px-4 py-8 gap-6">
        <div>{data.useremail}</div>
        <div>
          <img src={imageUrl} className="h-15" />
        </div>
        <div>
          <CountryFlag
            countryCode={data.countryCode}
            svg
            style={{ fontSize: '2em' }}
          />
          {data.countryCode}
        </div>
        <div>
          {data.state == 'private' && data.billed && (
            <button onClick={handlePublic}>Public</button>
          )}
        </div>
      </div>
    </>
  )
}

const mapStateToProps = (state) => ({
  user: state.user,
  post: state.post,
  keyword: state.post.keyword,
})

export default connect(mapStateToProps, { updatePostStore })(
  AdItem
)
