
import { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button, } from '@mui/material'
import { Pen, Save, Trash2 } from 'lucide-react'
import CountryFlag from 'react-country-flag'
import ReactCountryFlagsSelect from 'react-country-flags-select'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import userAvatar from '../../assets/images/user.png'
import './profile.css'
import { userInfoSave, uploadUserAvatar, deleteUserAvatar } from '../../store/actions/userActions'
import { serviceList, skillList } from '../../consts';

const ProfileEdit = (props) => {
  const wrapperRef = useRef(null);
  const infoRef = useRef(null);
  const descRef = useRef(null);
  const skillsRef = useRef(null);
  const servicesRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setEditing({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user)
  const [userData, setUserData] = useState({
    ...user,
    blocks: [],
    skillInput: '',
    serviceInput: '',
  });
  const { skillInput, serviceInput, skills, services } = userData;
  const [editing, setEditing] = useState({})

  const addTagToList = (tag, type) => {
    if (type === 'skill' && tag && !userData.skills.includes(tag)) {
      setUserData((prev) => ({
        ...prev,
        skills: [...prev.skills, tag],
        skillInput: '',
      }));
    } else if (type === 'service' && tag && !userData.services.includes(tag)) {
      setUserData((prev) => ({
        ...prev,
        services: [...prev.services, tag],
        serviceInput: '',
      }));
    }
  };

  const removeTagFromList = (index, type) => {
    if (type === 'skills') {
      setUserData((prev) => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index),
      }));
    } else if (type === 'services') {
      setUserData((prev) => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== index),
      }));
    }
  };

  const handleKeyDownTag = (e, type) => {
    if ((e.key === 'Enter' || e.key === ',') &&
      (type === 'skill' ? skillInput.trim() : serviceInput.trim())
    ) {
      e.preventDefault()
      addTagToList((type === 'skill' ? skillInput : serviceInput).trim(), type)
    }
  }

  const filteredSkillSuggestions = skillList.filter(
    (skill) => skill.tag.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(skill.tag)
  )

  const filteredServiceSuggestions = serviceList.filter(
    (service) => service.tag.toLowerCase().includes(serviceInput.toLowerCase()) && !services.includes(service.tag)
  )

  const handleFocus = (field) => {
    const inputRefs = {
      information: infoRef,
      description: descRef,
      skills: skillsRef,
      services: servicesRef,
    }

    setEditing((prev) => {
      const isEditing = prev[field]
      if (isEditing) return { ...prev, [field]: false }
      setTimeout(() => inputRefs[field]?.current?.focus(), 100)
      return { ...prev, [field]: true }
    })
  }
  
  useEffect(() => {
    if (editing.description && userData.description && descRef.current) {
      const textarea = descRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editing.description]);

  const handleSelectImage = async (event) => {
    const file = event.target.files[0];
    event.target.value = null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Unsupported file type");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large (max 5MB)");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setUserData((prev) => ({ ...prev, photoUrl: localUrl, photo: 1, file }));
  };
  
  const handleUpdateAvatar = () => {
    dispatch(uploadUserAvatar(userData.file)).then((res) => {
        if (res) {
          setUserData((prev) => ({ ...prev, photo: 0, file: null }));
        }
      })
      .catch((err) => console.error("Upload failed", err));
  };

  const handleDeleteAvatar = () => {
    const { photoUrl } = user
    if (!photoUrl) {
      setUserData((prev) => ({ ...prev, photoUrl: "", photo: 0, file: null }))
      return
    }
    dispatch(deleteUserAvatar()).then((res) => {
      if (res) {
        setUserData((prev) => ({ ...prev, photoUrl: "", photo: 0, file: null }))
      }
      }).catch((err) => {
        console.error("Avatar delete failed:", err);
      });
  };

  const onSave = async (type, value) => {
    try {
      const updated = await dispatch(userInfoSave(type, value, skills, services));
      if (updated) {
        setEditing({ ...editing, [type]: false });
      }
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  return (
    <div ref={wrapperRef}>
      <div className="h-full min-h-[calc(100vh-108px)]">
        <div className="w-full mx-auto mb-2 border border-gray-200 rounded-xl overflow-hidden">
          <div className="relative">
            <img
              className="w-full h-[157px] object-cover"
              src="/assets/images/profile/back.png"
              alt="Cover"
            />
            <div className= "absolute left-20 top-[77px] w-[170px] h-[170px] border-4 border-white rounded-full overflow-hidden">
              {!userData.photoUrl ? (
                <label htmlFor="fileInput" className="relative block w-full h-full cursor-pointer group">
                  <img
                    className="w-full h-full object-cover transition group-hover:grayscale group-hover:brightness-75"
                    src={userAvatar}
                    alt="Profile"
                  />
                </label>
              ) : (
                <div className="relative block w-full h-full group hover:z-10">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); return}}
                    className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1"
                  >
                    {
                      userData.photo == true && <Save size={24} strokeWidth={2.25} className='cursor-pointer'
                        onClick={handleUpdateAvatar}
                      />
                    }
                    
                    <Trash2 size={24} strokeWidth={2.25} className='cursor-pointer' onClick={handleDeleteAvatar} />
                  </button>

                  <img
                    className="w-full h-full object-cover transition group-hover:grayscale group-hover:brightness-75"
                    src={userData.photoUrl}
                    alt="Profile"
                  />
                </div>
              )}
            </div>

            <input
              type="file"
              id="fileInput"
              accept="image/jpeg,image/png,image/gif,image/webp"
              hidden
              onChange={handleSelectImage}
            />
          </div>

          <div className="pt-30 pb-6 px-8 bg-white min-h-[220px]">
            <div className="flex items-start justify-between mb-2">
              <div className="w-full">
                <div className="relative flex items-center justify-between gap-4 mb-3">
                  {editing.username ? (
                    <>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={20}
                          className="w-full border-b border-blue-300 outline-none text-[22px] font-medium text-[#181818]"
                          value={userData.username}
                          placeholder="Enter your name..."
                          onChange={(e) =>
                            setUserData((prev) => ({ ...prev, username: e.target.value }))
                          }
                        />
                        {userData.username && (
                          <AiOutlineCloseCircle
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666666] cursor-pointer"
                            size={18}
                            onClick={() => setUserData((prev) => ({ ...prev, username: '' }))}
                          />
                        )}
                      </div>
                      <Save
                        className="cursor-pointer !p-0 !min-w-[18px] !h-[18px]"
                        size={18}
                        onClick={() => onSave('username', userData.username)}
                      />
                    </>
                  ) : (
                    <>
                      <h2 className="text-[22px] font-medium text-[#181818]">
                        {userData.username || 'No name'}
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer !p-0 !min-w-[18px] !h-[18px] translate-y-[1px]"
                        onClick={() => handleFocus('username')}
                      >
                        <Pen size={18} />
                      </Button>
                    </>
                  )}
                </div>

                <div className="relative flex items-center justify-between gap-4">
                  {editing.information ? (
                    <>
                      <div className="relative flex-1">
                        <input ref={infoRef}
                          type="text"
                          maxLength={30}
                          className={`w-full border-b ${
                            editing.information ? 'border-blue-300' : 'border-gray-300'
                          } outline-none`}
                          placeholder="Input your information..."
                          value={userData.information}
                          onChange={(e) =>
                            setUserData((prev) => ({ ...prev, information: e.target.value, }))
                          }
                        />
                        {userData.information && (
                          <AiOutlineCloseCircle
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-[#666666] cursor-pointer"
                            size={18}
                            onClick={() => setUserData((prev) => ({ ...prev, information: '' })) }
                          />
                        )}
                      </div>
                      
                      <Save
                        className="cursor-pointer !p-0 !min-w-[18px] !h-[18px]"
                        size={18}
                        onClick={() =>
                          onSave('information', userData.information)
                        }
                      />
                    </>
                  ) : (
                    <>
                      <div className="">{userData.information}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer !p-0 !min-w-[18px] !h-[18px] translate-y-[1px]"
                        onClick={() => handleFocus('information')}>
                        <Pen size={18} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`w-full mx-auto borderborder-gray-200 rounded-xl bg-white ${userData.role.admin ? "min-h-[457px]" : "min-h-[418px]"}`}>
          <div className="p-8 relative">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-[#181818] font-['Montserrat',Helvetica] mb-4">
                  General information
                </h3>
                {
                  (!editing.description && !userData.description) && <div className="flex items-start justify-between gap-4 mb-2 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer !p-0 !min-w-[18px] !h-[18px] translate-y-[1px]"
                      onClick={() => handleFocus('description')}>
                      <Pen size={18} />
                    </Button>
                  </div>
                }
              </div>
              {(!editing.description && userData.description) && (
                <div className="flex items-start justify-between gap-4 mb-2 pl-2 relative">
                  <div className="flex-1 whitespace-pre-line text-[15px] text-[#181818]">
                    {userData.description}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer !p-0 !min-w-[18px] !h-[18px] translate-y-[1px]"
                    onClick={() => handleFocus('description')}
                  >
                    <Pen size={18} />
                  </Button>
                </div>
              )}

              <div className="relative flex items-center gap-4 w-full">
                {editing.description && (
                  <div className="flex items-center gap-4 w-full">
                    <div className="relative flex-1">
                      <textarea ref={descRef}
                        className={`w-full px-3 py-2 border-b ${
                          editing.description ? 'border-blue-300' : 'border-gray-300'
                        } outline-none resize-none text-[15px] leading-snug custom-scrollbar`}
                        value={userData.description}
                        placeholder="Input description..."
                        rows={2}
                        onChange={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          setUserData((prev) => ({ ...prev, description: e.target.value, }));
                        }}
                      />
                      {userData.description && (
                        <AiOutlineCloseCircle
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666666] cursor-pointer"
                          size={18}
                          onClick={() => {
                            setUserData((prev) => ({ ...prev, description: '' }));
                            if (descRef.current) {
                              descRef.current.style.height = 'auto';
                            }
                          }}
                        />
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer !p-0 !min-w-[18px] !h-[18px]"
                    >
                      <Save
                        size={18}
                        onClick={() => onSave('description', userData.description)}
                      />
                    </Button>
                  </div>
                )}

              </div>
                  
              <div className="space-y-4">
                {/* country */}
                <div className="relative mt-3">
                  <div className="flex items-start mb-2 w-full justify-between relative">
                    <div className="flex items-center gap-5 flex-wrap">
                      <label className="text-lg font-medium text-[#181818] whitespace-nowrap mr-2">
                        Country:
                      </label>

                      {editing.country ? (
                        <div className="w-[240px]">
                          <ReactCountryFlagsSelect
                            selected={ userData?.country?.countryCode ? userData.country : null }
                              onSelect={(country) => {
                                if (!country || country.countryCode === userData.country?.countryCode) return;
                                setUserData((prev) => ({
                                  ...prev,
                                  country: {
                                    countryCode: country?.countryCode,
                                    label: country?.label,
                                  },
                                }));
                              }}
                            searchable
                            className="w-full custom-scrollbar"
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
                            searchPlaceholder="Type or select country..."
                          />
                        </div>
                      ) : userData.country?.countryCode ? (
                        <>
                          <CountryFlag className='text-2xl'
                            countryCode={userData.country?.countryCode}
                            svg
                          />
                          <span className="text-[15px] text-black font-semibold">{userData.country.label}</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Not selected</span>
                      )}
                    </div>

                    {editing.country ? (
                      <Save
                        className="absolute right-0 top-1 cursor-pointer text-[#666666]"
                        size={18}
                        onClick={() => {
                          if (!userData.country?.countryCode) return;
                          onSave('country', userData.country);
                        }}
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer !p-0 !min-w-[18px] !h-[18px] translate-y-[1px]"
                        onClick={() => handleFocus('country')}
                      >
                        <Pen size={18} />
                      </Button>
                    )}
                  </div>
                </div>
                {/* skill */}
                <div className="relative mt-6">
                  <div className="flex items-start mb-2 w-full">
                    <div className="flex-shrink-0 mr-4">
                      <label className="text-lg font-medium text-[#181818] whitespace-nowrap">
                        Skills:
                      </label>
                    </div>

                    <div className="flex-1 flex flex-wrap gap-2 min-h-[28px] items-center">
                      {skills.map((skill, idx) =>
                        editing.skills ? (
                          <span
                            key={idx}
                            onClick={() => removeTagFromList(idx, 'skills')}
                            className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200 transition"
                          >
                            {skill}
                          </span>
                        ) : (
                          <span
                            key={idx}
                            className="bg-blue-200 text-[13px] text-black font-semibold px-3 py-1 rounded-full transition"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      {!editing.skills && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer !p-0 !min-w-[18px] !h-[18px]"
                          onClick={() => handleFocus('skills')}
                        >
                          <Pen size={18} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {editing.skills && (
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <input ref={skillsRef}
                          type="text"
                          value={skillInput}
                          onChange={(e) => setUserData(prev => ({ ...prev, skillInput: e.target.value }))}
                          onKeyDown={(e) => handleKeyDownTag(e, 'skill')}
                          placeholder="Input your skill..."
                          className={`w-full px-3 py-2 border-b ${
                            editing.skills ? 'border-blue-300' : 'border-gray-300'
                          } outline-none`}
                        />
                        {skillInput && (
                          <AiOutlineCloseCircle
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-[#666666] cursor-pointer"
                            size={18}
                            onClick={() => setUserData(prev => ({ ...prev, skillInput: '' })) }
                          />
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer !p-0 !min-w-[18px] !h-[18px]"
                      >
                        <Save
                          size={18}
                          onClick={() => onSave('skills', skills)}
                        />
                      </Button>
                    </div>
                  )}

                  {skillInput && editing.skills && (
                    <ul className="mt-1 bg-white border-none rounded shadow text-sm max-h-[150px] overflow-y-auto relative w-full custom-scrollbar">
                      {filteredSkillSuggestions.map((tag) => (
                        <li
                          key={tag.id}
                          onClick={() => addTagToList(tag.tag, 'skill')}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[14px]"
                        >
                          #{tag.tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* service */}
                
                  
                <div className="relative mt-6">
                  <div className="flex items-start mb-2 w-full">
                    <div className="flex-shrink-0 mr-4">
                      <label className="text-lg font-medium text-[#181818] whitespace-nowrap">
                        Services:
                      </label>
                    </div>

                    <div className="flex-1 flex flex-wrap gap-2 min-h-[28px] items-center">
                      {services.map((service, index) =>
                        editing.services ? (
                          <span
                            key={index}
                            onClick={() => removeTagFromList(index, 'services')}
                            className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-green-200 transition"
                          >
                            {service}
                          </span>
                        ) : (
                          <span
                            key={index}
                            className="bg-green-100 text-[13px] text-black font-semibold px-3 py-1 rounded-full transition"
                          >
                            {service}
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      {!editing.services && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer !p-0 !min-w-[18px] !h-[18px]"
                          onClick={() => handleFocus('services')}
                        >
                          <Pen size={18} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {editing.services && (
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <input ref={servicesRef}
                          type="text"
                          value={serviceInput}
                          onChange={(e) => setUserData(prev => ({ ...prev, serviceInput: e.target.value }))}
                          onKeyDown={(e) => handleKeyDownTag(e, 'service')}
                          placeholder="Input your services..."
                          className={`w-full px-3 py-2 border-b ${
                            editing.services ? 'border-blue-300' : 'border-gray-300'
                          } outline-none`}
                        />
                        {serviceInput && (
                          <AiOutlineCloseCircle
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-[#666666] cursor-pointer"
                            size={18}
                            onClick={() => setUserData(prev => ({ ...prev, serviceInput: '' })) }
                          />
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer !p-0 !min-w-[18px] !h-[18px]"
                      >
                        <Save
                          size={18}
                          onClick={() => onSave('services', services)}
                        />
                      </Button>
                    </div>
                  )}

                  {serviceInput && editing.services && (
                    <ul className="mt-1 bg-white border-none rounded shadow text-sm max-h-[150px] overflow-y-auto relative w-full custom-scrollbar">
                      {filteredServiceSuggestions.map((tag) => (
                        <li
                          key={tag.id}
                          onClick={() => addTagToList(tag.tag, 'service')}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[14px]"
                        >
                          #{tag.tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileEdit