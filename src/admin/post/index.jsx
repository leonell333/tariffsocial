import {
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow
} from '@mui/material'
import { format } from 'date-fns'
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  doc,
  updateDoc
} from 'firebase/firestore'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../../firebase'
import { updateBaseStore } from '../../store/actions/baseActions'

const AdminPosts = (props) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [selectedState, setSelectedState] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [keyword1, setKeyword1] = useState('')

  const PAGE_SIZE = 8
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [snapshots, setSnapshots] = useState([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const TABS = [
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
  ]

  const TABLE_HEAD = [
    { label: 'Name', value: 'username' },
    { label: 'Content', value: 'contentText' },
    { label: 'Time', value: 'createdAt' },
    { label: 'Status', value: 'state' },
    { label: 'Action', value: '' },
  ]

  const getFilters = () => {
    const base = selectedState !== 'all' ? [where('state', '==', selectedState)] : []
    if(keyword) base.push(where('keywords', 'array-contains', keyword.trim().toLowerCase()))
    const order = orderBy(sortField, sortOrder)
    return [...base, order]
  }

  useEffect(() => {
    setPosts([])
    setSnapshots([])
  }, [location.pathname])

  const fetchTotalCount = async () => {
    let cons=selectedState == 'all'?[]:[where('state', '==', selectedState)]
    if(keyword) cons.push(where('keywords', 'array-contains', keyword.trim().toLowerCase()))
    const baseQuery =query(collection(db, 'posts'), ...cons)
    const snapshot = await getCountFromServer(baseQuery)
    const totalDocs = snapshot.data().count
    setTotalCount(totalDocs)
    // console.log(cons);
    setTotalPages(Math.ceil(totalDocs / PAGE_SIZE))
  }

  const fetchPage = async (pageNum) => {
    if (pageNum < 0) return
    props.updateBaseStore({ loading: true })
    const newSnapshots = [...snapshots]
    let fetchedPosts = []

    try {
      const filters = getFilters()
      let q
      if (pageNum === 0) {
        q = query(collection(db, 'posts'), ...filters, limit(PAGE_SIZE))
      } else if (newSnapshots[pageNum - 1]) {
        q = query(
          collection(db, 'posts'),
          ...filters,
          startAfter(newSnapshots[pageNum - 1]),
          limit(PAGE_SIZE)
        )
      }
      const snapshot = await getDocs(q)
      fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      if (!newSnapshots[pageNum] && snapshot.docs.length > 0) {
        newSnapshots[pageNum] = snapshot.docs[snapshot.docs.length - 1]
      }

      setIsLastPage(fetchedPosts.length < PAGE_SIZE)
      setSnapshots(newSnapshots)

      setPosts(fetchedPosts)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    }

    props.updateBaseStore({ loading: false })
  }

  useEffect(() => {
    fetchTotalCount()
  }, [selectedState,keyword])

  useEffect(() => {
    fetchPage(0)
  }, [selectedState, sortField, sortOrder, keyword])

  const handleChangePage = (event, newPage) => fetchPage(newPage)
  
  const textStyle = {
    maxWidth: '100%',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const updatePostState = (post,state) => {
    const postSnap = doc(db, "posts", post.id);
    updateDoc(postSnap, { state })
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, state }
          : p
      )
    )
  };  


  return (
    <div className="bg-white flex justify-center w-full">
      <div className="bg-white w-full max-w-[1320px] relative px-4">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {TABS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setSelectedState(value)}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ml-1 mr-1 ${
                    selectedState === value
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Please enter the search keyword"
                value={keyword1}
                onChange={(e) => setKeyword1(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setKeyword(keyword1)}
                className="w-full md:w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="posts table">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" />
                  </TableCell>
                  {TABLE_HEAD.map((head) => (
                    <TableCell
                      key={head.label}
                      onClick={() => {
                        if (head.value) {
                          setSortField(head.value)
                          setSortOrder((prev) =>
                            sortOrder === 'asc' ? 'desc' : 'asc'
                          )
                        }
                      }}>
                      <div className="flex items-center gap-2">
                        {head.label}
                        {sortField === head.value &&
                          (sortOrder === 'desc' ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUp size={14} />
                          ))}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.map((post, index) => {
                  const isTrue = post.state === true || post.state === 'true'
                  return (
                    <React.Fragment key={post.id}>
                      <TableRow hover role="checkbox" tabIndex={-1}>
                        <TableCell padding="checkbox">
                          <Checkbox />
                        </TableCell>
                        <TableCell>{post.username}</TableCell>
                        <TableCell><pre
                          className="whitespace-pre-wrap break-words cursor-pointer  font-[SF_Pro_Text]"
                          style={textStyle}>
                          {post.contentText}
                        </pre></TableCell>
                        <TableCell>
                          {post.createdAt?.toDate
                            ? format(post.createdAt.toDate(), 'MMM d')
                            : ''}
                        </TableCell>
                        <TableCell>{post.state}</TableCell>
                        <TableCell>
                           {post.state=="Approved" && <div onClick={() =>updatePostState(post,'Rejected') } 
                                    className="text-sm text-green-600 font-medium cursor-pointer">Reject</div>}
                            {post.state=="Rejected" && <div onClick={() =>updatePostState(post,'Approved') } 
                                    className="text-sm text-red-600 font-medium cursor-pointer">Approve</div>}
                        </TableCell>
                      </TableRow>
                      {expandedIndex === index && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div
                              dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[PAGE_SIZE]}
            component="div"
            count={totalCount}
            rowsPerPage={PAGE_SIZE}
            page={page}
            onPageChange={handleChangePage}
          />
        </Paper>
      </div>
    </div>
  )
}

const mapStateToProps = (state) => ({
  keyword: state.post.keyword,
  unReadMessages: state.base.unReadMessages,
  user: state.user,
})

export default connect(mapStateToProps, {
  updateBaseStore,
})(AdminPosts)
