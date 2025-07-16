import {connect} from 'react-redux';
import {updateBaseStore} from '../../store/actions/baseActions';
import {updatePostStore} from '../../store/actions/postActions';
import {getServerTime} from '../../utils';

const Dev = (props) => {
  return (<>
      
      <div className="bg-white flex justify-center w-full">
        <button
            type="button"
            className="bg-[#161722] text-white text-[18px]  font-[SF_Pro_Text] rounded-lg cursor-pointer rounded-md h-12 w-40 mr-5"
            >
            updateImageUrl
          </button>
          
      </div>
      <button
            type="button"
            className="bg-[#4a4b58] text-white text-[18px]  font-[SF_Pro_Text] rounded-lg cursor-pointer rounded-md h-12 w-40 mr-5"
            onClick={async ()=>{
              let serverTime=getServerTime();
              console.log(serverTime);
            }}>
            getServerTime
          </button>
    </>)
}

const mapStateToProps = (state) => ({
    keyword: state.post.keyword,
    unReadMessages: state.base.unReadMessages,
    user: state.user,
  });
  
export default connect(
    mapStateToProps,
    {  updateBaseStore, updatePostStore }
)(Dev);
  

