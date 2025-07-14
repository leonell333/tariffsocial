
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import "../../pages/post/post.css";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { useNavigate } from 'react-router-dom';
import { Avatar, Button } from '@mui/material';
import { getNewColleagues } from '../../store/actions/colleagueAction';
import { updateUserStore } from '../../store/actions/userActions';

const Colleagues = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { newColleagues } = useSelector(state => state.colleague);

  const handleAvatarClick = (colleague) => {
    try {
      dispatch(updateUserStore({ selectedUser: colleague }));
      navigate('/profile/' + colleague.id);
    } catch (err) {
      console.error('Error selecting colleague:', err);
    }
  };

  useEffect(() => {
    if (user.authenticated) {
      dispatch(getNewColleagues()).then((res) => {
        }).catch(err => console.error(err));
    }
  }, [user.authenticated])

  return (
    <div className='w-full'>
      <Card className="shadow-none flex flex-col items-center justify-center gap-2.5 border border-[#EBEBEB] rounded-xl bg-white p-3 mb-2">
        <CardContent className="p-0 w-full">
          <div className="text-[#181818] text-[18px] mx-auto w-fit" style={{ fontFamily: 'poppins', fontWeight: 700 }}>
            Colleagues and affiliates
          </div>
          <section className="w-full">
            {newColleagues.map((colleague, index) => (
              <div key={colleague.id} className="relative w-full">
                <div
                  className="flex items-center gap-2 py-1 w-full cursor-pointer text-3 colleagues-item"
                  onClick={() => handleAvatarClick(colleague)}
                >
                  <Avatar src={colleague.photoUrl} sx={{ width: 49, height:49 }} />
                  <div className="flex flex-col items-start justify-center ml-[5px]">
                    <h3 className="text-[#181818] text-lg">{colleague.username}</h3>
                    <p className="text-[#787878] text-[15px]">{colleague.information}</p>
                    <div className="flex gap-2">
                      <span className="text-[#787878] text-[15px] text-black">{colleague.followerCount ? colleague.followerCount : 0}</span>
                      <span className="text-[#787878] text-[15px]">followers</span>
                    </div>
                  </div>
                </div>
                <Separator className="w-[275px] my-1 bg-[#E9E5DF] colleagues-separator" />
              </div>
            ))}
          </section>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="flex items-center justify-center gap-[21px] mt-2 p-0 h-auto"
              onClick={() => navigate('/recommendations')}
            >
              <span className="text-[#939393] text-sm tracking-wide leading-4 normal-case">
                See all recommendations
              </span>
              <svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.96636 0.5L10.3438 0.500282L14.5 5.39363L10.3438 10.4998L8.96636 10.5L7.58896 10.4998L10.7712 6.40837H0.5V4.37889H10.7712L7.58896 0.500282L8.96636 0.5Z"
                  fill="#949494"
                />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Colleagues;
