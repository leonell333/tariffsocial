
import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InputAdornment, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import ReactCountryFlagsSelect from "react-country-flags-select";
import "../../pages/advertise/advertise.css";
import countries from "../../consts/country";
import { currencies } from "../../consts";
import { isValidEmail } from "../../utils";
import { createOrUpdateSponsoredAd } from "../../store/actions/advertiseAction";
import { updateAdvertiseStore } from "../../store/actions/advertiseAction";

const CreateSponsored = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedAd = useSelector((state) => state.advertise.selectedAd);
  const user = useSelector((state) => state.user);

  const [rte, setRte] = useState(undefined);
  const [stateSponsored, setStateSponsored] = useState({
    imageFile: "",
    title: "",
    email: "",
    name: "",
    phone: "",
    budget: 1,
    pubDate: dayjs(),
    days: 7,
    currency: "USD",
    country: { label: "Australia", countryCode: "AU" },
    businessName: "",
    author: "",
    link: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  var refdiv = useRef(null);

  const updateSponsoredState = (key, value) => {
    setStateSponsored(prev => ({
      ...prev,
      [key]: value
    }));
    setErrors(prev => ({
      ...prev,
      [key]: undefined
    }));
  };

  const handleSelectImage = (event) => {
    var file = event.target.files[0];
    const reader = new FileReader();
    var url = reader.readAsDataURL(file);
    reader.onloadend = function (e) {
      updateSponsoredState('imageFile', reader.result);
    }.bind(this);
  };

  let currencyList = currencies.map((c) => {
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: c,
      currencyDisplay: "symbol",
    });
    const parts = formatter.formatToParts(1);
    const symbol = parts.find((p) => p.type === "currency")?.value || c;
    return { code: c, symbol };
  });

  useEffect(() => {
    updateSponsoredState('country', { label: "Australia", countryCode: "AU" });
    // Cleanup on unmount: reset selectedAd
    return () => {
      dispatch(updateAdvertiseStore({ selectedAd: null }));
    };
  }, []);

  useEffect(() => {
    if (selectedAd && selectedAd.type === 'sponsored') {
      setStateSponsored({
        imageFile: "",
        title: selectedAd.title || "",
        email: selectedAd.email || "",
        name: selectedAd.name || "",
        phone: selectedAd.phone || "",
        budget: selectedAd.budget || 1,
        days: selectedAd.days || 1,
        currency: selectedAd.currency || "USD",
        country: selectedAd.country || { label: "Australia", countryCode: "AU" },
        businessName: selectedAd.businessName || "",
        author: selectedAd.author || "",
        link: selectedAd.link || "",
        pubDate: dayjs(selectedAd.pubDate?.toDate ? selectedAd.pubDate.toDate() : selectedAd.pubDate),
      });
      setTimeout(() => {
        let editor = new window.RichTextEditor(refdiv.current);
        editor.setHTMLCode(selectedAd.content || "");
        setRte(editor);
      }, 10);
    }
  }, [selectedAd]);

  useEffect(() => {
    setTimeout(function () {
      let rte1 = new window.RichTextEditor(refdiv.current);
      rte1.setHTMLCode("");
      setRte(rte1);
    }, 10);
  }, []);

  const handleSponsored = async () => {
    let content = rte.getHTMLCode();
    let document = rte.getDocument();

    let d = stateSponsored.pubDate ? stateSponsored.pubDate.toDate() : null;
    if (d) {
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
    }

    let newErrors = {};
    if (!stateSponsored.name) {
      newErrors.name = 'Please enter your name.';
    }
    if (!stateSponsored.title) {
      newErrors.title = 'Please enter the title.';
    }
    if (!stateSponsored.email) {
      newErrors.email = 'Please enter the email.';
    } else if (!isValidEmail(stateSponsored.email)) {
      newErrors.email = 'Please enter the email address correctly.';
    }
    if (!stateSponsored.country) {
      newErrors.country = 'Please select country.';
    }
    if (isNaN(Number(stateSponsored.budget))) {
      newErrors.budget = 'Please enter a number value for the budget.';
    }
    if (isNaN(Number(stateSponsored.days))) {
      newErrors.days = 'Please enter a number value for the number of days';
    } else if (Number(stateSponsored.days) < 7) {
      newErrors.days = 'The number of days should be a little over 7 days.';
    }
    if (!stateSponsored.pubDate) {
      newErrors.pubDate = 'Please select a publish date.';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    dispatch(createOrUpdateSponsoredAd({
      stateSponsored: {
        ...stateSponsored,
        content,
        pubDate: d,
        ownerId: user.id,
      },
      editId: selectedAd?.type === 'sponsored' ? selectedAd?.id : undefined,
      document,
    })).then((res) => {
      if (res) {
        if (!selectedAd) {
          navigate(`/payment?id=${res}&type=sponsored`);
        }
      }
    }).catch((err) => {
      console.error('Error creating/updating sponsored ad:', err);
    });
  };

  return (
    <div className="w-full min-h-[calc(100vh-170px)] border border-[#EBEBEB] rounded-xl bg-white">
      <style>
        {`
          rte-floatpanel.rte-floatpanel-paragraphop {
            display: none !important;
          }
        `}
      </style>
      <div className="text-[26px] text-center py-3 text-black font-bold">
        Sponsored Content
      </div>
      <div className="flex flex-col lg:flex-row gap-2 w-full">
        <div className="basis-1/3 pl-5 pr-5">
          <div>
            <TextField
              variant="outlined"
              label="Name"
              value={stateSponsored.name}
              onChange={(e) => updateSponsoredState('name', e.target.value)}
              className="w-full"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: "custom-outline",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
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
        <div className="basis-1/3 pl-5 pr-5">
          <div>
            <TextField
              variant="outlined"
              value={stateSponsored.email}
              label="Email"
              onChange={(e) => updateSponsoredState('email', e.target.value)}
              className="w-full"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: "custom-outline",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
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
        <div className="basis-1/3 pl-5 pr-5">
          <div className="relative">
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
              selected={stateSponsored.country?.countryCode ? stateSponsored.country : null}
              onSelect={(country) => {
                if (!country || country.countryCode === stateSponsored.country?.countryCode) return;
                setStateSponsored(prev => ({
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
      <div className="flex flex-col lg:flex-row gap-2 w-full mt-5">
        <div className="basis-1/3 pl-5 pr-5">
          <div>
            <TextField
              variant="outlined"
              label="Business Name"
              value={stateSponsored.businessName}
              onChange={(e) => updateSponsoredState('businessName', e.target.value)}
              className="w-full"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: "custom-outline",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
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
              value={stateSponsored.author}
              onChange={(e) => updateSponsoredState('author', e.target.value)}
              className="w-full"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: "custom-outline",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
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
              value={stateSponsored.link}
              label="Link to site"
              onChange={(e) => updateSponsoredState('link', e.target.value)}
              className="w-full link-to-site"
              size="small"
              InputProps={{
                classes: {
                  notchedOutline: "custom-outline",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
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
            className="w-full placeholder:text-[20px] border border-[#c4c4c4] rounded-[8px] border-r h-13 mt-3 py-2 px-6 hover:border-[#808080] focus:border-2 focus:border-[#1976d2] focus:outline-none"
            value={stateSponsored.title}
            placeholder="sponsored title"
            onChange={(e) => updateSponsoredState('title', e.target.value)}
          />
          {errors.title && (
            <div className="text-red-500 text-xs mt-1">{errors.title}</div>
          )}
        </div>
      </div>
      <div className="w-full px-5 mt-3">
        <div className="w-full h-80" ref={refdiv} id="sponsored_editor"></div>
      </div>
      <div className="flex px-5 mt-8 gap-4">
        <div className="basis-1/4">
          <TextField
            variant="outlined"
            label="Phone Number"
            fullWidth
            value={stateSponsored.phone}
            onChange={(e) => updateSponsoredState('phone', e.target.value)}
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
            disabled={selectedAd && selectedAd.type === 'sponsored'}
            value={stateSponsored.budget}
            onChange={(e) => updateSponsoredState('budget', e.target.value)}
            fullWidth
            size="small"
            label="Budget"
            sx={{
              "& .MuiOutlinedInput-root": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "gray",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "gray",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
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
                      disabled={selectedAd && selectedAd.type === 'sponsored'}
                      fullWidth
                      select
                      size="small"
                      value={stateSponsored.currency}
                      onChange={(e) => updateSponsoredState('currency', e.target.value)}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { border: "none" },
                          backgroundColor: "transparent",
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
            error={!!errors.budget}
            helperText={errors.budget}
          />
        </div>

        <div className="basis-1/4">
          <DatePicker
            label="Publish Date"
            disabled={selectedAd && selectedAd.type === 'sponsored'}
            value={stateSponsored.pubDate}
            onChange={(newValue) => updateSponsoredState('pubDate', newValue)}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                InputLabelProps: {
                  shrink: true,
                },
                sx: {
                  "& .MuiOutlinedInput-root": {
                    fontSize: "14px",
                    borderRadius: "4px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "gray",
                    },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#1976d2",
                    },
                  "& .MuiInputLabel-root": {
                    backgroundColor: "#ffffff",
                    padding: "0 4px",
                    transform: "translate(14px, -9px) scale(0.75)",
                    color: "gray",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#1976d2",
                  },
                },
              },
            }}
          />
          {errors.pubDate && (
            <div className="text-red-500 text-xs mt-1">{errors.pubDate}</div>
          )}
        </div>

        <div className="basis-1/4">
          <TextField
            variant="outlined"
            label="Number of days"
            disabled={selectedAd && selectedAd.type === 'sponsored'}
            value={stateSponsored.days}
            onChange={(e) => updateSponsoredState('days', e.target.value)}
            fullWidth
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "gray",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "gray",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
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
            onClick={handleSponsored}
          >
            {selectedAd && selectedAd.type === 'sponsored' ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSponsored;