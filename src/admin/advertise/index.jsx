import SearchIcon from '@mui/icons-material/Search'
import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore'
import {
  getDownloadURL,
  ref as storageRef
} from 'firebase/storage'
import { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { db, storage, storageBucket } from '../../firebase'
import { updateBaseStore } from '../../store/actions/baseActions'
import { updatePostStore } from '../../store/actions/postActions'
import { extractKeywords, sendRequest } from '../../utils'

const stripeBackend = import.meta.env.VITE_BACKEND

import CountryFlag from 'react-country-flag'

const AdminAds = (props) => {
  const [ads, setAds] = useState([])
  const [billedStatus, setBilledStatus] = useState('all')
  const [status, setStatus] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [keyword1, setKeyword1] = useState('')

  useEffect(() => {
    search()
  }, [status, billedStatus, keyword])

  const handleStateChange = (ad, newState) => {
    if (newState == 'Approved') {
      let expire = new Date(ad.pubDate.toDate())
      expire.setDate(expire.getDate() + 7)
      const adSnap = doc(db, 'ads', ad.id)
      updateDoc(adSnap, { expire, state: newState }).then((res) => {
        sendRequest('/cron/send_email', 'POST', {
          email: ad.email,
          subject: 'Advertisement was published.',
          text: `Your advertisement ${ad.name} was publised.`,
          html: `Your advertisement <b>${ad.name}</b>  was publised.`,
        })
        setAds(
          ads.map((_ad) =>
            _ad.id != ad.id ? _ad : { ...ad, expire, state: newState }
          )
        )
      })
    } else {
      const adSnap = doc(db, 'ads', ad.id)
      updateDoc(adSnap, { state: newState }).then((res) => {
        setAds(
          ads.map((_ad) =>
            _ad.id != ad.id ? _ad : { ..._ad, state: newState }
          )
        )
      })
    }
  }
  const search = async () => {
    let ads_ = []
    const conditions = [where('ownerId', '==', props.user.id)]
    if (billedStatus == 'Billed') conditions.push(where('billed', '==', true))
    if (billedStatus == 'UnBilled')
      conditions.push(where('billed', '==', false))
    if (status != 'all') conditions.push(where('state', '==', status))
    let keys = extractKeywords(keyword)
    if (keys.length != 0)
      conditions.push(where('keywords', 'array-contains-any', keys))
    conditions.push(orderBy('createdAt', 'desc'))
    //conditions.push(limit(4))
    let coll = collection(db, 'ads')
    const q = query(coll, ...conditions)
    try {
      const snap = await getDocs(q)
      snap.forEach((doc) => {
        let data = doc.data()
        ads_.push({ id: doc.id, ...data })
      })
    } catch (error) {
      console.log(error)
    }

    for (var i = 0; i < ads_.length; i++) {
      try {
        const gsReference = storageRef(
          storage,
          'gs://' + storageBucket + '/ads/' + ads_[i].id
        )
        let url = await getDownloadURL(gsReference)
        ads_[i].image = url
      } catch (error) {
        console.log(error)
      }
    }
    setAds(ads_)
  }

  return (
    <>
      <div className="flex">
        <FormControl sx={{ width: 150 }}>
          <InputLabel id="status-label">Statius : </InputLabel>
          <Select
            labelId="status-label"
            id="status"
            value={status}
            label="Age"
            onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value={'all'}>All</MenuItem>
            <MenuItem value={'Pending'}>Pending</MenuItem>
            <MenuItem value={'Approved'}>Approved</MenuItem>
            <MenuItem value={'Rejected'}>Rejected</MenuItem>
          </Select>
        </FormControl>
        <div className="ml-3 w-35">
          <FormControl fullWidth>
            <InputLabel id="status-label">Billing Statius : </InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={billedStatus}
              label="Age"
              onChange={(e) => setBilledStatus(e.target.value)}>
              <MenuItem value={'all'}>All</MenuItem>
              <MenuItem value={'Billed'}>Billed</MenuItem>
              <MenuItem value={'UnBilled'}>UnBilled</MenuItem>
            </Select>
          </FormControl>
        </div>
        <TextField
          label="Search"
          sx={{ ml: 1, width: 300 }}
          value={keyword1}
          onChange={(e) => setKeyword1(e.target.value)}
          onKeyUp={(e) => {
            if (e.keyCode == 13) setKeyword(keyword1)
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>
      <form
        action={`${stripeBackend}/stripe/create-checkout-session`}
        method="POST"
        id="payment_form">
        <input type="hidden" id="jsonData" name="jsonPayload" />
      </form>
      <TableContainer component={Paper}>
        <Table sx={{}} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell align="left">Status</TableCell>
              <TableCell align="left">useremail</TableCell>
              <TableCell align="left">Name</TableCell>
              <TableCell align="left">Link</TableCell>
              <TableCell align="left">Image</TableCell>
              <TableCell align="left">Country</TableCell>
              <TableCell align="left">Budget for a day</TableCell>
              <TableCell align="left">Number of days</TableCell>
              <TableCell align="left">Publish Date</TableCell>
              <TableCell align="left">Billing Statius</TableCell>
              <TableCell align="left"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ads.map((ad, index) => (
              <TableRow
                key={ad.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {index + 1}
                </TableCell>
                <TableCell align="left">{ad.state}</TableCell>
                <TableCell align="left">{ad.email}</TableCell>
                <TableCell align="left">{ad.name}</TableCell>
                <TableCell align="left">{ad.productLink}</TableCell>
                <TableCell align="left">
                  <img src={ad.image} className="h-15" />
                </TableCell>
                <TableCell align="left">
                  <CountryFlag
                    countryCode={ad.countryCode}
                    svg
                    style={{ fontSize: '2em' }}
                  />
                  {ad.countryCode}
                </TableCell>
                <TableCell align="left">${ad.budget}</TableCell>
                <TableCell align="left">{ad.days}</TableCell>
                <TableCell align="left">
                  {ad.pubDate.toDate().toLocaleDateString()}
                </TableCell>
                <TableCell align="left">
                  {ad.billed ? 'Billed' : 'UnBilled'}
                </TableCell>
                <TableCell align="left">
                  {(ad.state == 'Pending' || ad.state == 'Rejected') && (
                    <Button onClick={() => handleStateChange(ad, 'Approved')}>
                      Approve
                    </Button>
                  )}
                  {(ad.state == 'Pending' || ad.state == 'Approved') && (
                    <Button onClick={() => handleStateChange(ad, 'Rejected')}>
                      Reject
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {props.paymentModal && <ConnectedCheckoutModal />}
    </>
  )
}

const mapStateToProps = (state) => ({
  user: state.user,
  paymentModal: state.base.paymentModal,
})

export default connect(mapStateToProps, { updateBaseStore, updatePostStore })(AdminAds)
