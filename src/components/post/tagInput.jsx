
import { useState, forwardRef, useImperativeHandle, useRef, useEffect, } from 'react'
import { connect } from 'react-redux'
import '../../pages/post/post.css'
import { updateBaseStore } from '../../store/actions/baseActions'
import { toast } from 'react-toastify'

const TagInput = forwardRef((props, ref) => {
  const [tags, setTags] = useState([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState(props.tags)
  const inputRef = useRef()

  useImperativeHandle(ref, () => ({
    getTags: () => {
      return tags
    },
  }))

  useEffect(() => {
    setSuggestions(props.tags)
  }, [props.tags])

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
      setInput('')
    }
  }

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input.trim())
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.tag.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s.tag)
  )

  return (
    <div className="border rounded px-3 py-2 w-full bg-white">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded flex items-center gap-1">
            #{tag}
            <button onClick={() => removeTag(tag)} className="text-xs">
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="outline-none w-full"
        placeholder="Type or select a tag..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {input && (
        <ul className="mt-1 bg-white border rounded shadow text-sm">
          {filteredSuggestions.map((tag) => (
            <li
              key={tag.id}
              onClick={() => addTag(tag.tag)}
              className="px-3 py-1 hover:bg-gray-100 cursor-pointer">
              #{tag.tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

const mapStateToProps = (state) => ({
  tags: state.base.tags,
})

export default connect(mapStateToProps, { updateBaseStore }, null, {
  forwardRef: true,
})(TagInput)
