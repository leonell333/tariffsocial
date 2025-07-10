
import { useNavigate } from 'react-router-dom'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

const AdvertiseRateCard = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-white p-[10px] min-h-[calc(100vh-108px)] rounded-xl">
      <div style={{ fontFamily: 'poppins', marginTop: '35px' }}>
        <h1 className="text-[28px] font-bold mb-4 text-center text-black">Advertising Sponsored Content Rate Card</h1>
        <div className="responsive-table-wrapper">
          <TableContainer component={Paper} sx={{ overflowX: 'auto', p: 2, maxWidth: '100%', outline: "none", boxShadow: 'none', }}>
              <Table sx={{ width: '100%', boxSizing: 'border-box' }} aria-label="rate card table">
                <TableHead sx={{ background: '#ECECEC'}}>
                  <TableRow>
                    <TableCell sx={{ width: '60%', textOverflow: 'ellipsis', p: 1, pl: '20px', fontSize: '20px', fontWeight: '600', }} align="left">Description</TableCell>
                    <TableCell sx={{ width: '40%', textOverflow: 'ellipsis', p: 1, pr: '20px', fontSize: '20px', fontWeight: '600', }} align="right">Price</TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: '60%', p: 1, pl: '20px'}}>
                    <p className="mb-2 text-[18px]">Sponsored Content (30 days)</p>
                  </TableCell>
                  <TableCell sx={{ width: '40%', p: 1, pr: '20px', }} align="right">
                    <p className="mb-2 text-[18px]"><strong>$US500 per piece</strong></p>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ width: '60%', p: 1, pl: '20px' }}>
                    <p className="mb-2 text-[18px]">Advertising (Varies based on demand - May 1825)</p>
                  </TableCell>
                  <TableCell sx={{ width: '40%', p: 1, pr: '20px', }} align="right">
                    <p className="mb-2 text-[18px]"><strong>Variable</strong></p>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ width: '60%', p: 1, pl: '20px' }}>
                    <p className="mb-2 text-[18px]">Banner Advertising (Max 7 days or $30/month)</p>
                  </TableCell>
                  <TableCell sx={{ width: '40%', p: 1, pr: '20px', }} align="right">
                    <p className="mb-2 text-[18px]"><strong>$2 per day</strong></p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <div className="text-right mr-5">
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ padding: '6px 16px', fontSize: '14px', borderRadius: '25px' }}
            onClick={() => { navigate('/publish/ads') }}
          >
            Create an ad campaign
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvertiseRateCard;