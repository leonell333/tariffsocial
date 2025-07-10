import { useState, useRef, useEffect } from 'react'
import { Modal } from '@mui/material'
import { updateBaseStore } from '../../store/actions/baseActions'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'

const WebcamContainer = styled.div`
  position: relative;
  width: 100%;
  margin: 0 auto;
`

const WebcamVideo = styled.video`
  width: 100%;
  border-radius: 10px;
`

const PreviewImg = styled.img`
  width: 100%;
  border-radius: 10px;
`

const WebcamCanvas = styled.canvas`
  display: none;
`

const WebcamButton = styled.button`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fff;
  color: #333;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const WebcamOKButton = styled.button`
  position: absolute;
  bottom: 20px;
  left: 60%;
  transform: translateX(-50%);
  background-color: #fff;
  color: #333;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const WebcamCapture = (props) => {
  const dispatch = useDispatch()
  const captureCamera = useSelector(state => state.base.captureCamera)
  const capturedImage = useSelector(state => state.base.capturedImage)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [mediaStream, setMediaStream] = useState(null)
  const [localCapturedImage, setLocalCapturedImage] = useState(null)

  useEffect(() => {
    startWebcam()
  }, [])

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
        },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setMediaStream(stream)
    } catch (error) {
      console.error('Error accessing webcam', error)
    }
  }

  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop()
      })
      setMediaStream(null)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageDataUrl = canvas.toDataURL('image/jpeg')

        setLocalCapturedImage(imageDataUrl)
        stopWebcam()
      }
    }
  }

  const resetState = () => {
    stopWebcam()
    setLocalCapturedImage(null)
    startWebcam()
  }
  return (
    <Modal
      open={captureCamera}
      className="create-sponsored"
      onClose={() => dispatch(updateBaseStore({ captureCamera: false }))}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      disableScrollLock
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[700px] bg-white rounded-xl p-6 shadow-lg">
        <WebcamContainer>
          {localCapturedImage ? (
            <>
              <PreviewImg src={localCapturedImage} className="captured-image" />
              <WebcamButton style={{ left: '40%' }} onClick={resetState}>
                Reset
              </WebcamButton>
              <WebcamButton
                style={{ left: '60%' }}
                onClick={() => {
                  if (props.handleOK) props.handleOK(localCapturedImage)
                  dispatch(updateBaseStore({ capturedImage: localCapturedImage, captureCamera: false }))
                }}>
                Ok
              </WebcamButton>
            </>
          ) : (
            <>
              <WebcamVideo ref={videoRef} autoPlay muted />
              <WebcamCanvas ref={canvasRef} />
              {!videoRef.current ? (
                <>
                  <WebcamButton
                    onClick={startWebcam}
                    style={{ backgroundColor: '#333', color: '#fff' }}>
                    Start Webcam
                  </WebcamButton>
                </>
              ) : (
                <WebcamButton onClick={captureImage}>
                  Capture Image
                </WebcamButton>
              )}
            </>
          )}
        </WebcamContainer>
      </div>
    </Modal>
  )
}

export default WebcamCapture;
