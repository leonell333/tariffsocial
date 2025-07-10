import {
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import ReactCountryFlagsSelect from 'react-country-flags-select'
import { useSelector, useDispatch } from 'react-redux'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { toast } from 'react-toastify'
import '../../pages/advertise/advertise.css'
import countries from '../../consts/country'
import { currencies } from '../../consts'
import WebcamCapture from '../post/webcamCapture'

import { extractKeywords, isValidEmail } from '../../utils'
import { createOrUpdateSponsoredAd, fetchSponsoredAdById } from '../../store/actions/advertiseAction'
import { updateBaseStore } from '../../store/actions/baseActions'

const CreateSponsored = () => {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const [rte, setRte] = useState(undefined)
  const [imageFile, setImageFile] = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [budget, setBudget] = useState(1)
  const [pubDate, setPubDate] = useState(dayjs())
  const [days, setDays] = useState(1)
  const [currency, setCurrency] = useState('USD')
  const [selectedCountry, setSelectedCountry] = useState(() => ({label: 'Australia', countryCode: 'AU'}))
  
  const [businessName, setBusinessName] = useState('')
  const [author, setAuthor] = useState('')
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  var refdiv = useRef(null)
  const handleSelectImage = (event) => {
    var file = event.target.files[0]
    const reader = new FileReader()
    var url = reader.readAsDataURL(file)
    reader.onloadend = function (e) {
      setImageFile(reader.result)
    }.bind(this)
  }

  let currencyList = currencies.map((c) => {
    const formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: c,
      currencyDisplay: 'symbol',
    })
    const parts = formatter.formatToParts(1)
    const symbol = parts.find((p) => p.type === 'currency')?.value || c
    return { code: c, symbol }
  })

  useEffect(() => {
    setSelectedCountry({ label: 'Australia', countryCode: 'AU' })
  }, [])

  useEffect(() => {
    if (!editId) return

    const getSponsoredAdData = async () => {
      const data = await dispatch(fetchSponsoredAdById(editId))
      if (data) {
        if (data.state === 'Approved' || data.ownerId !== user.id) {
          navigate('/')
          return
        }
        setName(data.name || '')
        setEmail(data.email || '')
        setTitle(data.title || '')
        setPhone(data.phone || '')
        setCurrency(data.currency || 'USD')
        setBudget(data.budget || 1)
        setDays(data.days || 1)
        setBusinessName(data.businessName || '')
        setAuthor(data.author || '')
        setLink(data.link || '')
        const match = countries.find((c) => c.value === data.countryCode)
        if (match)
          setSelectedCountry({ label: match.title, countryCode: match.value })
        setPubDate(dayjs(data.pubDate?.toDate ? data.pubDate.toDate() : data.pubDate))

        setTimeout(() => {
          let editor = new window.RichTextEditor(refdiv.current)
          editor.setHTMLCode(data.content || '')
          setRte(editor)
        }, 10)
      }
    }

    getSponsoredAdData()
  }, [editId])

  useEffect(() => {
    setTimeout(function () {
      let rte1 = new window.RichTextEditor(refdiv.current)
      rte1.setHTMLCode('')
      setRte(rte1)
    }, 10)
  }, [])

  const handleSubmit = async () => {
    let content = rte.getHTMLCode()
    let contentText = rte.getText()
    let document = rte.getDocument()
    
    let dateObj = pubDate.toDate()
    dateObj.setHours(0)
    dateObj.setMinutes(0)
    dateObj.setSeconds(0)

    if (!name) {
      toast.error('Please enter the name.')
      return
    }
    if (!title) {
      toast.error('Please enter the title.')
      return
    }
    if (!email) {
      toast.error('Please enter the email.')
      return
    }
    if (!isValidEmail(email)) {
      toast.error('Please enter the email address correctly.')
      return
    }
    if (isNaN(Number(budget))) {
      toast.error('Please enter a number value for the budget.')
      return
    }
    if (isNaN(Number(days))) {
      toast.error('Please enter a number value for the number of days')
      return
    }
    if (Number(days) < 7) {
      toast.error('The number of days should be a little over 7 days.')
      return
    }

    dispatch(updateBaseStore({ loading: true }))

    await dispatch(createOrUpdateSponsoredAd({
      editId,
      name,
      title,
      businessName,
      countryCode: selectedCountry.countryCode,
      author,
      link,
      content,
      contentText,
      email,
      phone,
      budget,
      days,
      pubDate: dateObj,
      currency,
      ownerId: user.id,
      navigate,
      setLoading: (val) => {
        setLoading(val)
        dispatch(updateBaseStore({ loading: val }))
      },
      document,
    }))
  }

  return (
    <div className="w-full border border-[#EBEBEB] rounded-xl bg-white">
      <div className="text-[26px] text-center py-3 font-extrabold font-[SF_Pro_Text] text-black">
        Sponsored Content
      </div>
      <div className="flex flex-col lg:flex-row gap-2 w-full">
        <div className="basis-1/3 pl-5 pr-5">
          <div>
            <TextField
              variant="outlined"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: 'custom-outline',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                  },
                },
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </div>
        </div>
        <div className="basis-1/3 pl-5 pr-5">
          <div>
            <TextField
              variant="outlined"
              value={email}
              label="Email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: 'custom-outline',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                  },
                },
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </div>
        </div>
        <div className="basis-1/3 pl-5 pr-5">
          <div className="relative country-select-wrapper">
            <div>
              <style>
                {` .ReactSelectFlags-module_searchSelect__O6Fp2 {
                        border: 1px solid gray !important;
                        border-radius: 4px !important;
                        outline: none !important;
                        box-shadow: none !important;
                      }

                      /* On focus/click */
                      .ReactSelectFlags-module_searchSelect__O6Fp2:focus-within {
                        border: 2px solid #1976d2 !important;
                      }
                      .country-select-wrapper:focus-within .country-label {
                        color: #1976d2 !important;
                      }
                    `}
              </style>
              <ReactCountryFlagsSelect
                selectHeight={40}
                classes={{ width: '100%', borderRadius: 20 }}
                className="custom-country-select"
                defaultValue="AU"
                selected={selectedCountry}
                onSelect={setSelectedCountry}
                fullWidth
                searchable
              />
            </div>
            <div className="absolute text-gray-500 top-[-11px] left-[13px] px-2 pointer-events-none select-none z-10 bg-[#ffffff] text-[13px] country-label">
              Country
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-2 w-full mt-5">
        <div className="basis-1/3 pl-5 pr-5">
          <div>
            <TextField
              variant="outlined"
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: 'custom-outline',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                  },
                },
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </div>
        </div>
        <div className="basis-1/3 pl-5 pr-5">
          <div>
            <TextField
              variant="outlined"
              label="Author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: 'custom-outline',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                  },
                },
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </div>
        </div>
        <div className="basis-1/3 pl-5 pr-5">
          <div>
            <TextField
              variant="outlined"
              value={link}
              label="Link to site"
              onChange={(e) => setLink(e.target.value)}
              className="w-full link-to-site"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: 'custom-outline',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                  },
                },
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </div>
        </div>
      </div>
      <div className="px-5">
        <div>
          <input
            type="text"
            className="w-full placeholder:text-[20px] border border-[#c4c4c4] rounded-[8px] border-r h-15 my-3 py-3 px-6 hover:border-[#808080] focus:border-2 focus:border-[#1976d2] focus:outline-none"
            value={title}
            placeholder="New sponsored content title here...."
            onChange={(e) => {
              setTitle(e.target.value)
            }}
          />
        </div>
      </div>
      <div className="w-full px-5">
        <div className="w-full h-80" ref={refdiv} id="sponsored_editor"></div>
      </div>
      <div className="flex px-5 mt-8 gap-4">
        <div className="basis-1/4">
          <TextField
            variant="outlined"
            label="Phone Number"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            size="small"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </div>

        <div className="basis-1/4">
          <TextField
            variant="outlined"
            disabled={editId}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            fullWidth
            size="small"
            label="Budget"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'gray',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'gray',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2',
                },
              },
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <TextField
                      disabled={editId}
                      fullWidth
                      select
                      size="small"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { border: 'none' },
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      {currencyList.map((option) => (
                        <MenuItem key={option.code} value={option.code}>
                          {option.symbol}
                        </MenuItem>
                      ))}
                    </TextField>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="start"> per a day</InputAdornment>
                ),
              },
            }}
          />
        </div>

        <div className="basis-1/4">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Publish Date"
              disabled={editId}
              value={pubDate}
              onChange={(newValue) => setPubDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: {
                    shrink: true,
                  },
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      fontSize: '14px',
                      borderRadius: '4px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'gray',
                    },
                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                      {
                        borderColor: 'gray',
                      },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                      {
                        borderColor: '#1976d2',
                      },
                    '& .MuiInputLabel-root': {
                      backgroundColor: '#ffffff',
                      padding: '0 4px',
                      transform: 'translate(14px, -9px) scale(0.75)',
                      color: 'gray',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#1976d2',
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </div>

        <div className="basis-1/4">
          <TextField
            variant="outlined"
            label="Number of days"
            disabled={editId}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'gray',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'gray',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2',
                },
              },
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </div>
      </div>

      <div className="w-full">
        <div className="w-fit m-auto py-5">
          <button
            type="button"
            className="bg-[#161722] text-white text-[18px]  font-[SF_Pro_Text] cursor-pointer rounded-md h-12 w-30 mr-5"
            onClick={handleSubmit}>
            {editId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateSponsored