
import { useEffect, useState } from 'react'
import { InputAdornment, MenuItem, TextField, } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import ReactCountryFlagsSelect from 'react-country-flags-select'
import { FaCloudUploadAlt } from 'react-icons/fa'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { currencies } from '../../consts'
import { isValidEmail } from '../../utils'
import { createOrUpdateBannerAd } from '../../store/actions/advertiseAction'
import { AiOutlineCloseCircle } from 'react-icons/ai';
import dayjs from 'dayjs'
import '../../pages/advertise/advertise.css'

const CreateBannerAdvertise = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [stateAdvertise, setStateAdvertise] = useState({
    imageFile: '',
    country: { countryCode: 'AU', label: 'Australia' },
    productLink: '',
    email: '',
    title: '',  
    currency: 'USD',
    name: '',
    businessName: '',
    budget: 1,
    pubDate: dayjs(),
    days: 7,
  })

  const [errors, setErrors] = useState({});
  const user = useSelector(state => state.user)
  const updateAdvertiseState = (key, value) => {
    setStateAdvertise(prev => ({
      ...prev,
      [key]: value
    }))
    setErrors(prev => ({
      ...prev,
      [key]: undefined
    }))
  }

  const handleSelectImage = (event) => {
    var file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = function (e) {
      updateAdvertiseState('imageFile', reader.result)
      event.target.value = null;
    }.bind(this)
  }

  const handleDeleteImage = () => {
    setStateAdvertise((prev) => ({ ...prev, imageFile: '', file: null }));
  };

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
    updateAdvertiseState('country', { label: 'Australia', countryCode: 'AU' })
  }, [])

  const handleAdvertise = async () => {
    let d = stateAdvertise.pubDate ? stateAdvertise.pubDate.toDate() : null;
    if (d) {
      d.setHours(0)
      d.setMinutes(0)
      d.setSeconds(0)
    }
    let newErrors = {};
    if (!stateAdvertise.name) {
      newErrors.name = 'Please enter your name.';
    }
    if (!stateAdvertise.email) {
      newErrors.email = 'Please enter the email.';
    } else if (!isValidEmail(stateAdvertise.email)) {
      newErrors.email = 'Please enter the email address correctly.';
    }
    if (!stateAdvertise.country) {
      newErrors.country = 'Please select country.';
    }
    if (!stateAdvertise.productLink) {
      newErrors.productLink = 'Please enter the Link path.';
    }
    if (isNaN(Number(stateAdvertise.budget))) {
      newErrors.budget = 'Please enter a number value for the budget.';
    }
    if (isNaN(Number(stateAdvertise.days))) {
      newErrors.days = 'Please enter a number value for the number of days';
    } else if (Number(stateAdvertise.days) < 7) {
      newErrors.days = 'The number of days should be a little over 7 days.';
    }
    if (!stateAdvertise.imageFile) {
      newErrors.imageFile = 'Please select image';
    }
    if (!stateAdvertise.pubDate) {
      newErrors.pubDate = 'Please select a publish date.';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    dispatch(createOrUpdateBannerAd({
      stateAdvertise: {
        ...stateAdvertise,
        pubDate: d,
        ownerId: user.id,
      },
    })).then((res) => {
      if (res) {
        console.log('res',res);
        navigate(`/publish/payment?id=${res}&type=ads`); // Updated path
      }
    }).catch((err) => {
      console.error('Error creating/updating ad:', err);
    });
    
  }

  return (
    <div className="w-full min-h-[calc(100vh-170px)] border border-[#EBEBEB] rounded-xl bg-white">
      <div className="text-[26px] text-center py-3 text-black font-bold" style={{ fontFamily: 'poppins' }}>  
        Create Campaign
      </div>
      <div className="flex flex-col lg:flex-row gap-5 w-full">
        <div className="basis-1/3 px-5">
          <div>
            <TextField
              variant="outlined"
              label="Name"
              value={stateAdvertise.name}
              onChange={(e) => updateAdvertiseState('name', e.target.value)}
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
              error={!!errors.name}
              helperText={errors.name}
            />
          </div>
        </div>
        <div className="basis-1/3 px-5">
          <div>
            <TextField
              variant="outlined"
              value={stateAdvertise.email}
              label="Email"
              onChange={(e) => updateAdvertiseState('email', e.target.value)}
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
              error={!!errors.email}
              helperText={errors.email}
            />
          </div>
        </div>
       
        <div className="basis-1/3 px-5">
          <div className="w-full relative">
            <style>
              {`
                .ReactSelectFlags-module_searchSelect__O6Fp2 {
                  border: 1px solid gray !important;
                  border-radius: 4px !important;
                  outline: none !important;
                  box-shadow: none !important;
                  width: 100% !important;
                }
                .ReactSelectFlags-module_control__aWqic {
                  width: 100% !important;
                }
                .ReactSelectFlags-module_container__Xxx {
                  width: 100% !important;
                }
                .ReactSelectFlags-module_valueContainer__abc {
                  width: 100% !important;
                }
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
              fullWidth
              className="w-full custom-country-select custom-scrollbar"
              selected={stateAdvertise.country?.countryCode ? stateAdvertise.country : null}
              onSelect={(country) => {
                if (!country || country.countryCode === stateAdvertise.country?.countryCode) return;
                setStateAdvertise(prev => ({
                  ...prev,
                  country: {
                    countryCode: country?.countryCode,
                    label: country?.label,
                  },
                }));
                setErrors(prev => ({
                  ...prev,
                  country: undefined
                }));
              }}
              searchable
              optionsListMaxHeight={250}
              classes={{
                menu: 'custom-country-menu',
                option: 'custom-country-option',
                optionLabel: 'custom-country-option-label',
                flag: 'custom-country-flag',
                selected: 'custom-country-selected',
                input: 'custom-country-input',
                list: 'custom-country-list',
                container: 'custom-country-container'
              }}
            />
            {errors.country && (
              <div className="text-red-500 text-xs mt-1">{errors.country}</div>
            )}
            <div className="absolute text-gray-500 top-[-11px] left-[13px] px-2 pointer-events-none select-none z-10 bg-[#ffffff] text-[13px] country-label">
              Country
            </div>
          </div>
        </div>
        
      </div>

      <div className="flex flex-col lg:flex-row gap-5 w-full mt-5">
        <div className="basis-1/3 px-5">
          <div>
            <TextField
              variant="outlined"
              label="Business Name"
              value={stateAdvertise.businessName}
              onChange={(e) => updateAdvertiseState('businessName', e.target.value)}
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
        <div className="basis-1/3 px-5">
          <div>
            <TextField
              variant="outlined"
              label="Compaign Title"
              value={stateAdvertise.title}
              onChange={(e) => updateAdvertiseState('title', e.target.value)}
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
        <div className="basis-1/3 px-5">
          <div>
            <TextField
              variant="outlined"
              value={stateAdvertise.productLink}
              label="Link"
              onChange={(e) => updateAdvertiseState('productLink', e.target.value)}
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
              error={!!errors.productLink}
              helperText={errors.productLink}
            />
          </div>
        </div>
      </div>

      <div className="px-5 text-black relative mt-5">
        <div className="absolute bg-[#FFFFFF] top-[-14px] left-[33px] px-2 text-gray-500 z-10">
          Upload Image
        </div>
        <div
          className="w-full border border-[#c4c4c4] min-h-[140px]  rounded-lg cursor-pointer relative"
          onClick={() => {
            const fileInput = document.getElementById('fileInput')
            fileInput.click()
          }}>
          {!stateAdvertise.imageFile ? (
            <div className="mx-auto mt-4 flex flex-col ">
              <div className="">
                <FaCloudUploadAlt className="m-auto text-[90px]" />
              </div>
              <div className="text-center text-4">Upload Image</div>
            </div>
          ) : (
            <div className="relative w-full h-[280px] flex justify-center items-center">
              <img className="py-1 w-auto h-full" src={stateAdvertise.imageFile} alt="Preview" />
              <AiOutlineCloseCircle
                className="absolute top-2 right-2 text-[#666666] cursor-pointer bg-white rounded-full shadow"
                size={26}
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteImage();
                }}
                title="Remove image"
              />
            </div>
          )}
        </div>
        <input type="file" id="fileInput" hidden onChange={handleSelectImage} />
        {errors.imageFile && (
          <div className="text-red-500 text-xs mt-1">{errors.imageFile}</div>
        )}
      </div>

      <div className="text-[20px] text-center py-3  text-black ">
        Budget and Publishing Details
      </div>

      <div className="flex flex-col lg:flex-row gap-2 w-full mt-5">
        <div className="basis-1/3 px-5">
          <TextField
            variant="outlined"
            value={stateAdvertise.budget}
            onChange={(e) => updateAdvertiseState('budget', e.target.value)}
            className="w-full"
            size="small"
            label="Budget"
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
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <TextField
                      id="outlined-select-currency"
                      fullWidth
                      select
                      hiddenLabel
                      size="small"
                      classes={{ border: 'none' }}
                      value={stateAdvertise.currency}
                      onChange={(e) => updateAdvertiseState('currency', e.target.value)}
                      variant="outlined"
                      placeholder="Minimal"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { border: 'none' },
                          backgroundColor: 'transparent',
                        },
                      }}>
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

              inputLabel: {
                shrink: true,
              },
            }}
            error={!!errors.budget}
            helperText={errors.budget}
          />
        </div>

        <div className="basis-1/3 px-5">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Publish Date"
              value={stateAdvertise.pubDate}
              onChange={(newValue) => updateAdvertiseState('pubDate', newValue)}
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
                        borderColor: '#1976d2 !important',
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
                field: { clearable: true },
              }}
              onClose={(reason) => {
                if (reason === 'clear') updateAdvertiseState('pubDate', null);
              }}
            />
          </LocalizationProvider>
          {errors.pubDate && (
            <div className="text-red-500 text-xs mt-1">{errors.pubDate}</div>
          )}
        </div>

        <div className="basis-1/3 px-5">
          <TextField
            variant="outlined"
            label="Number of days"
            value={stateAdvertise.days}
            onChange={(e) => updateAdvertiseState('days', e.target.value)}
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
            error={!!errors.days}
            helperText={errors.days}
          />
        </div>
      </div>

      <div className="w-full">
        <div className="w-fit m-auto py-5">
          <button
            type="button"
            className="bg-[#161722] text-white text-[18px]  rounded-xl cursor-pointer h-10 w-25"
            onClick={handleAdvertise}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateBannerAdvertise;