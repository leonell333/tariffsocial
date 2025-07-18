import {useEffect, useState} from 'react'
import {connect} from 'react-redux';
import {db, storage, storageBucket} from "../../firebase"
import {collection, doc, getDocs, orderBy, query, updateDoc, where} from "firebase/firestore";
import {ref as storageRef} from "firebase/storage";
import {useNavigate} from 'react-router';
import {updateBaseStore} from "../../store/actions/baseActions"
import {updatePostStore} from "../../store/actions/postActions"
import UpdateSponsored from '../../components/advertise/updateSponsored';
import {extractKeywords, getFireStoreUrl, sendRequest} from '../../utils';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import SearchIcon from '@mui/icons-material/Search';
import {Button, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField} from '@mui/material';

const stripeBackend = import.meta.env.VITE_BACKEND;

const AdminSponsored = (props) => {
  const [sponsoreds, setSponsoreds] = useState([]);
  const [billedStatus,setBilledStatus] = useState("all")
  const [status,setStatus] = useState("all")
  const [keyword,setKeyword] = useState("")
  const [keyword1,setKeyword1] = useState("")

  const navigate = useNavigate(); 
  useEffect(()=>{
    search()
  },[status,billedStatus,keyword])

  
    const handleStateChange=(sponsored,newState)=>{
      if(newState=="Approved")
      {
        let expire=new Date(sponsored.pubDate.toDate());

        expire.setDate(expire.getDate()+7);
        
        const sponsoredSnap = doc(db, "sponsored", sponsored.id);
        updateDoc(sponsoredSnap, { expire,state:newState}).then((res) => {
          sendRequest('/cron/send_email','POST',{
            email:sponsored.email,
            subject:'Sponsored content was published.',
            text:`Your sponsored content ${sponsored.title} was publised.`,
            html:`Your sponsored content <b>${sponsored.title}</b>  was publised.`
          })
          setSponsoreds(sponsoreds.map(_sponsored=>_sponsored.id!=sponsored.id?_sponsored:{...sponsored,expire,state:newState}))
        })
      }
      else
      {
        const sponsoredSnap = doc(db, "sponsored", sponsored.id);
        updateDoc(sponsoredSnap, { state:newState}).then((res) => {
          setSponsoreds(sponsoreds.map(_sponsored=>_sponsored.id!=sponsored.id?_sponsored:{..._sponsored,state:newState}))
        })
      }
    }
  const search=async ()=>{
    let _sponsoreds=[]
    const conditions = [where("ownerId","==",props.user.id)];
    if(billedStatus=="Billed") conditions.push(where("billed","==",true))
    if(billedStatus=="UnBilled") conditions.push(where("billed","==",false))
    if(status!="all") conditions.push(where("state","==",status))
    let keys=extractKeywords(keyword)
    if(keys.length!=0) conditions.push(where("keywords","array-contains-any",keys))
    conditions.push(orderBy("createdAt", "desc"))
    //conditions.push(limit(4))
    let coll=collection(db, "sponsored")
    const q=query(coll, ...conditions);
    try {
      const snap = await getDocs(q);
      snap.forEach(doc=>{
        let data=doc.data();
        _sponsoreds.push({id:doc.id,...data})
      })
    } catch (error) {
      console.log(error);
    }
    const regex = /firebaseimage:(\d+)/g;
   
    for(var i=0;i<_sponsoreds.length;i++)
    {
      let content=_sponsoreds[i].content;
      const matches = [...content.matchAll(regex)];
      for(let j=0;j<matches.length;j++)
      {
        let virtual_src=matches[j][0]
        let img_name=matches[j][1]
        try {
          const gsReference = storageRef(storage, 'gs://'+storageBucket+'/sponsored-images/'+img_name);
          let src=await getFireStoreUrl('sponsored-images/'+img_name);
          content=content.replace(virtual_src,src);
        } catch (error) {
          console.log(error);
        }
      }
      _sponsoreds[i].content=content
    }
    setSponsoreds(_sponsoreds);
  }
  
  
  return (<>
    <div className='flex'>
      <FormControl sx={{width:150}}>
        <InputLabel id="status-label">Statius : </InputLabel>
        <Select
          labelId="status-label"
          id="status"
          value={status}
          label="Age"
          onChange={(e)=>setStatus(e.target.value)}
        >
          <MenuItem value={"all"}>All</MenuItem>
          <MenuItem value={"Pending"}>Pending</MenuItem>
          <MenuItem value={"Approved"}>Approved</MenuItem>
          <MenuItem value={"Rejected"}>Rejected</MenuItem>
        </Select>
      </FormControl>
      <div className='ml-3 w-35'>
        <FormControl fullWidth>
          <InputLabel id="status-label">Billing Statius : </InputLabel>
          <Select
            labelId="status-label"
            id="status"
            value={billedStatus}
            label="Age"
            onChange={(e)=>setBilledStatus(e.target.value)}
          >
            <MenuItem value={"all"}>All</MenuItem>
            <MenuItem value={"Billed"}>Billed</MenuItem>
            <MenuItem value={"UnBilled"}>UnBilled</MenuItem>
          </Select>
        </FormControl></div>
        <TextField
          label="Search"
          sx={{ml:1, width: 300 }} value={keyword1} onChange={e=>setKeyword1(e.target.value)}
          onKeyUp={(e)=>{
            if(e.keyCode==13) setKeyword(keyword1)
          }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>,
            },
          }}
        />
      </div>
      <form action={`${stripeBackend}/stripe/create-checkout-session`} method="POST" id='payment_form'>
        <input type="hidden" id="jsonData" name="jsonPayload" />
      </form>
      <TableContainer component={Paper}>
        <Table sx={{  }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell align="left">Status</TableCell>
              <TableCell align="left">useremail</TableCell>
              <TableCell align="left">title</TableCell>
              <TableCell align="left">Budget for a day</TableCell>
              <TableCell align="left">Number of days</TableCell>
              <TableCell align="left">Publish Date</TableCell>
              <TableCell align="left">Billing Statius</TableCell>
              <TableCell align="left"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sponsoreds.map((sponsored,index) => (
              <TableRow
                key={sponsored.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {index+1}
                </TableCell>
                <TableCell align="left">{sponsored.state}</TableCell>
                <TableCell align="left">{sponsored.useremail}</TableCell>
                <TableCell align="left"><a className='cursor-pointer' onClick={()=>{
                  props.updatePostStore({sponsored})
                  props.updateBaseStore({sponsoredUpdateModal:true})
                }}>{sponsored.title}</a></TableCell>
                <TableCell align="left">${sponsored.budget}</TableCell>
                <TableCell align="left">{sponsored.days}</TableCell>
                <TableCell align="left">{sponsored.pubDate.toDate().toLocaleDateString()}</TableCell>
                <TableCell align="left">
                  {sponsored.billed ? "Billed":"UnBilled"}
                </TableCell>
                <TableCell align="left">
                  {(sponsored.state=="Pending" || sponsored.state=="Rejected") && <Button  onClick={()=>handleStateChange(sponsored,"Approved")}>Approve</Button>}
                  {(sponsored.state=="Pending" || sponsored.state=="Approved") && <Button onClick={()=>handleStateChange(sponsored,"Rejected")}>Reject</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {props.sponsoredUpdateModal && <UpdateSponsored search={search}/>}
    </>)
}

const mapStateToProps = (state) => ({
    user: state.user,
    paymentModal: state.base.paymentModal,
    sponsoredUpdateModal: state.base.sponsoredUpdateModal
  });
  
export default connect(
    mapStateToProps,
    {   updateBaseStore, updatePostStore }
)(AdminSponsored);
  

