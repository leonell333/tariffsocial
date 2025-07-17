
import React from 'react'
import { Modal, Box, Paper, Typography, List, ListItem, ListItemText, Divider } from '@mui/material'
import reportOptions from '../../consts/reportOptions'

const ReportModal = ({ open, onClose, onSelectOption }) => {
  return (
    <Modal
      open={open}
      className="report-modal"
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        display="flex"
        justifyContent="center"
        className="absolute m-auto"
        style={{ top: 'calc(50vh - 300px)', left: 'calc(50vw - 210px)' }}
      >
        <Box width="421px" overflow="hidden">
          <Paper
            elevation={0}
            sx={{
              width: '426px',
              padding: 3,
              border: '1px solid #e0dfdc',
              borderRadius: '4px',
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={1}>
              Why do you want to report this post?
            </Typography>
            <Typography
              variant="body2"
              color="#666666"
              textAlign="center"
              mb={3}
            >
              Your complaint is anonymous. If someone is in danger, don&#39;t wait –
              call your local emergency service.
            </Typography>
            <List sx={{ width: '100%' }}>
              {reportOptions.map((option, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    button
                    className="cursor-pointer"
                    onClick={() => onSelectOption(option)}
                    sx={{ padding: '8px 0' }}
                  >
                    <ListItemText
                      primary={option}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: '#181818',
                      }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>
    </Modal>
  )
}

export default ReportModal;
