import {useState} from 'react'
import {connect} from 'react-redux'
import {useNavigate} from 'react-router'
import {updateFollowers, updatePostStore,} from '../../store/actions/postActions'
import {Card, CardContent, CardHeader} from '../ui/card'

const ViewSponsored = (props) => {
  const [defaultTime, setDefaultTime] = useState(new Date())
  const { email, title, createdAt, ownerId, expand, content, contentText } = props
  const navigate = useNavigate()
  const [truncate, setToggleTruncate] = useState(false)

  function toggleTruncate() {
    if (expand) return
    setToggleTruncate(!truncate)
  }
  const textStyle = {
    maxWidth: '100%',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <>
      <Card className="w-full rounded-[10px] overflow-hidden mx-auto  border border-[#EBEBEB] rounded-xl shadow-none post-card p-4 mb-5 bg-white">
        <CardHeader className="p-0">
          <div className="flex items-start justify-between w-full ">
            Sponsored Content
          </div>
          <div className="flex items-start justify-between w-full ">
            <div className="flex items-center gap-0">
              <div className="text-xl text-[#181818] ml-4 font-[SF_Pro_Text] ">
                {title}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-[5px] font-[SF_Pro_Text] ">
          <div onClick={toggleTruncate} className="cursor-pointer">
            {truncate ? (
              <div
                className="w-full"
                dangerouslySetInnerHTML={{
                  __html: content
                    .replace(/style="[^"]*"/g, '')
                    .replace(/\. /g, '.\n'),
                }}
              />
            ) : (
              <pre
                className="whitespace-pre-wrap break-words cursor-pointer  font-[SF_Pro_Text]"
                style={textStyle}>
                {contentText}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

const mapStateToProps = (state) => ({
  user: state.user,
  post: state.post,
  keyword: state.post.keyword,
})

export default connect(mapStateToProps, {
  updatePostStore,
  updateFollowers,
})(ViewSponsored)
