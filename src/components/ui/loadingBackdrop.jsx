
import { Backdrop, CircularProgress, Box, LinearProgress, Typography } from '@mui/material';
import loading_logo from '../../assets/images/loading-logo.webp';

export default function LoadingBackdrop({ open, videoUploadProgress }) {
  return (
    <Backdrop
      sx={{
        color: '#82bbf4 !important',
        zIndex: (theme) => 9998,
        backgroundColor: 'rgba(0, 0, 0, 0.5) !important',
      }}
      open={open}
    >
      {typeof videoUploadProgress === 'number' ? (
        <Box
          sx={{
            width: 300,
            background: '#fff',
            borderRadius: 2,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: '#0e2841' }}>
            Uploading Video...
          </Typography>
          <LinearProgress
            variant="determinate"
            value={videoUploadProgress}
            sx={{ width: '100%', height: 10, borderRadius: 5, mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: '#0e2841' }}>
            {videoUploadProgress}%
          </Typography>
        </Box>
      ) : (
        <Box position="relative" width={60} height={60}>
          <CircularProgress
            size={57}
            thickness={2}
            sx={{
              color: '#82bbf4 !important',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          <img
            src={loading_logo}
            alt="Loading Icon"
            style={{
              width: '54px',
              height: '54px',
              top: '3px',
              left: '2px',
              position: 'absolute',
              borderRadius: '50%',
            }}
          />
        </Box>
      )}
    </Backdrop>
  );
} 