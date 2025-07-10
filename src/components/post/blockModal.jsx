import { Modal, Button } from '@mui/material'

const BlockModal = ({ open, onClose, onBlock, username }) => {
  return (
    <Modal
      open={open}
      className="block-modal"
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <div
        className="w-[425px] h-60 bg-white absolute top-[50vh - 120px ] rounded-xl outline-none"
        style={{ top: 'calc(50vh - 120px)', left: 'calc(50vw - 212px)' }}
      >
        <div className="flex flex-col items-center py-7 px-6 h-full">
          <h3 className="text-black text-[20px] mb-6">
            Block {username}?
          </h3>
          <p className="font-text-1-web text-black text-[16px] text-center mb-6">
            {username} won't be able to find your profile and content on
            Tariff Social. No one will see this user's replies to
            your posts, and they won't know you've blocked them.
          </p>

          <div className="flex justify-center gap-16 w-full">
            <Button
              variant="ghost"
              className="text-[#454545] font-text-1-web text-[16px] font-normal"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              variant="ghost"
              className="text-black font-tex-1-medium-web text-[16px] font-medium"
              onClick={onBlock}
            >
              Block
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default BlockModal;
