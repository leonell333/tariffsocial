import {useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import "../../pages/advertise/advertise.css";
import {db, storage} from "../../firebase";
import {doc, updateDoc} from "firebase/firestore";
import {ref as storageRef, uploadString} from "firebase/storage";
import {useNavigate} from "react-router";
import {updateBaseStore} from "../../store/actions/baseActions";
import {updatePostStore} from "../../store/actions/postActions";
import {toast} from "react-toastify";
import {DemoContainer} from "@mui/x-date-pickers/internals/demo";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import {Button, InputAdornment, Modal, TextField,} from "@mui/material";
import {extractKeywords, isValidEmail} from "../../utils";

const stropeBackend = import.meta.env.VITE_BACKEND;

var bEditor = false;

const UpdateSponsored = (props) => {
  const [rte, setRte] = useState(undefined);
  const [imageFile, setImageFile] = useState("");
  const [title, setTitle] = useState(props.sponsored.title);
  const [email, setEmail] = useState(props.sponsored.email);
  const [budget, setBudget] = useState(props.sponsored.budget);
  const [pubDate, setPubDate] = useState(
    dayjs(props.sponsored.pubDate.toDate())
  );
  const [days, setDays] = useState(props.sponsored.days);
  const [content, setContent] = useState(props.sponsored.content);
  const navigate = useNavigate();
  var refdiv1 = useRef(null);

  useEffect(() => {
    setTimeout(function () {
      let rte1 = new window.RichTextEditor(refdiv1.current);
      rte1.setHTMLCode(content);
      setRte(rte1);
    }, 100);
  }, []);
  const handleUpdate = async (e) => {
    let content = rte.getHTMLCode();
    let contentText = rte.getText();

    let document = rte.getDocument();
    let images = document.getElementsByTagName("img");
    let image_data = [];
    let image_name = [];
    for (var i = 0; i < images.length; i++) {
      let img_data = images[i].src;
      if (!img_data.startsWith("data:image/")) continue;
      image_data.push(images[i].src);
      let d = new Date();
      let img_name = d.getTime() + "";
      image_name.push(img_name);
      content = content.replace(images[i].src, `firebaseimage:${img_name}`);
    }
    let d = pubDate.toDate();
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);

    if (!title) {
      toast.error("Please enter the title.");
      return;
    }
    if (!email) {
      toast.error("Please enter the email.");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Please enter the email address correctly.");
      return;
    }
    if (isNaN(Number(budget))) {
      toast.error("Please enter a number value for the budget.");
      return;
    }
    if (isNaN(Number(days))) {
      toast.error("Please enter a number value for the number of days");
      return;
    }

    try {
      let keywords = extractKeywords(contentText);
      keywords = keywords.concat(extractKeywords(title));
      const snap = doc(db, "sponsored", props.sponsored.id);
      await updateDoc(snap, {
        title,
        content,
        contentText,
        email,
        budget: Number(budget),
        days: Number(days),
        pubDate: d,
        keywords,
      });
      if (image_data.length) {
        for (var ii = 0; ii < image_data.length; ii++) {
          const imageRef = storageRef(
            storage,
            `sponsored-images/${image_name[ii]}`
          );
          let result = await uploadString(imageRef, image_data[ii], "data_url");
        }
      }
      toast("The sponsored content was updated successfully.");
    } catch (error) {
      console.log(error);
    }
    props.search();
  };

  return (
    <Modal
      open={props.sponsoredUpdateModal}
      className="create-sponsored"
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <div
        className="max-w-[1200px] bg-white mx-auto mt-25 "
        style={{ width: "90vw" }}
      >
        <div>
          <input
            type="text"
            className="w-full border-solid border border-sky-500 border-black h-8 my-3 text-3xl h-15 py-3 px-6"
            value={title}
            placeholder="New sponsored content title here...."
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
        </div>
        <div>
          <div className="w-full h-100" ref={refdiv1}></div>
        </div>
        <div className="flex flex-wrap">
          <TextField
            label="Email"
            variant="outlined"
            required
            className="w-70"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Budget"
            variant="outlined"
            required
            className="w-60"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="start"> per a day</InputAdornment>
                ),
              },
            }}
          />
          <TextField
            className="w-80"
            label="Number of days"
            variant="outlined"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
          <DemoContainer components={["DatePicker"]}>
            <DatePicker
              label="Publishing Date"
              value={pubDate}
              onChange={(newValue) => setPubDate(newValue)}
            />
          </DemoContainer>
        </div>
        <div className="flex flex-row">
          <Button
            type="button"
            variant="contained"
            color="secondary"
            className="w-1/4  h-15"
            onClick={handleUpdate}
          >
            Update
          </Button>
          <Button
            type="button"
            variant="contained"
            color="secondary"
            className="w-1/4  h-15"
            onClick={() => {
              props.updateBaseStore({ sponsoredUpdateModal: false });
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const mapStateToProps = (state) => ({
  user: state.user,
  sponsoredUpdateModal: state.base.sponsoredUpdateModal,
  sponsored: state.post.sponsored,
});
export default connect(mapStateToProps, { updateBaseStore, updatePostStore })(
  UpdateSponsored
);
