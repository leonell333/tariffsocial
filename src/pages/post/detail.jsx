import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { doc, getDoc } from 'firebase/firestore'
import { ref as storageRef, getDownloadURL } from 'firebase/storage'
import { db, storage, storageBucket } from '../../firebase'
import Post from '../../components/post/post'
import { updateBaseStore } from '../../store/actions/baseActions'
import { updatePostStore } from '../../store/actions/postActions'
import { getFireStoreUrl } from '../../utils'

const PostDetail = () => {
  const dispatch = useDispatch()
  const keyword = useSelector(state => state.post.keyword)
  const unReadMessages = useSelector(state => state.base.unReadMessages)
  const user = useSelector(state => state.user)
  
  const { id } = useParams()
  const [post, setPost] = useState(null)

  useEffect(() => {
    loadPost()
  }, [])

  const loadPost = () => {
    const tempRef = doc(db, 'posts', id)
    let _post = {}
    getDoc(tempRef).then(async (doc) => {
      const data = doc.data()
      _post = { id: doc.id, ...data }
      _post.userPhoto = ''
      const regex = /firebaseimage:(\d+)/g
      try {
        let content = _post.content
        const matches = [...content.matchAll(regex)]
        for (let j = 0; j < matches.length; j++) {
          let virtual_src = matches[j][0]
          let img_name = matches[j][1]
          console.log(virtual_src)
          try {
            let src = await getFireStoreUrl('post-images/' + img_name)
            content = content.replace(virtual_src, src)
          } catch (error) {
            console.log(error)
          }
        }
        _post.content = content
        _post.userPhoto = await getFireStoreUrl('profile/' + _post.ownerId)
        if (_post.comments) {
          for (var j = 0; j < _post.comments.length; j++) {
            if (_post.comments[j].image) {
              try {
                _post.comments[j].image = await getFireStoreUrl('comment-images/' +_post.comments[j].image)
              } catch (error) {
                console.log(error)
              }
            }
            _post.comments[j].userPhoto = ''
            try {
              _post.comments[j].userPhoto = await getFireStoreUrl('profile/' +_post.comments[j].ownerId)
            } catch (error) {
              console.log(error)
            }
          }
        }
      } catch (error) {
        console.log(error)
      }
      setPost(_post)
    })
  }
  // console.log(post);

  return (
    <div className="my-3 mx-2">{post && <Post {...post} expand={true} />}</div>
  )
}

export default PostDetail
