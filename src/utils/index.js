import { useEffect } from 'react';
import axios from 'axios'
import { auth, db, storage, storageBucket } from "../firebase"
import {query, collection, doc ,getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion, getDocs, where, addDoc, Timestamp } from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const baseURL = import.meta.env.VITE_BACKEND;

export let alreadySynced = false;
export const markSynced = () => (alreadySynced = true);
export const resetSync = () => (alreadySynced = false);

export const sendRequest = (url, method, data) => {
  let config={
      headers: {
          'Content-Type': 'application/json'
        },
      url,
      method,
      baseURL,
      data
  }
  return axios.request(config)
}

export const extractKeywords = (contentHtml, tags = [], address = '') => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentHtml;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  const allText = `${textContent} ${tags.join(' ')} ${address}`.toLowerCase();
  const words = allText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an'].includes(word));
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  const keywords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 30)
    .map(([word]) => word);
  return keywords;
};

export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export const getCountryByCode = (code) => {
  code = code.toUpperCase()
  return countries.find((c) => c.code === code.toUpperCase());
};

export const parseDateFromString = (dateStr) => {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date string');
  }
  return parsed;
};

export const getTimeDifferenceString = (date1, date2) => {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 1) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours >= 1) {
    return `${diffHours} hr${diffHours > 1 ? 's' : ''}`;
  } else {
    return `${diffMins} min${diffMins > 1 ? 's' : ''}`;
  }
};

export const readTime = (createdAt) => {
  let createdDate;
  if (createdAt instanceof Date) {
    createdDate = createdAt;
  } else if (createdAt?.toDate) {
    createdDate = createdAt.toDate();
  } else if (typeof createdAt === 'string') {
    createdDate = parseDateFromString(createdAt);
  } else {
    throw new Error('Invalid createdAt value');
  }
  const currentTime = new Date();

  return getTimeDifferenceString(createdDate, currentTime);
};

export const getFormattedContent = (content) => {
  const videoMatches = [...content.matchAll(/<video[^>]*src="([^"]+)"[^>]*>/g)];
  const youtubeMatches = [
    ...content.matchAll(
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g
    ),
  ];
  const youtubeIds = youtubeMatches.map((match) => match[1]);
  const imageTags = [...content.matchAll(/<img[^>]*>/g)].map((match) => match[0]);

  let mediaHTML = '';
  if (videoMatches.length > 0) {
    mediaHTML = `<div class="quill-video-wrapper">${videoMatches[0][0].replace('<video', '<video autoplay muted controls=\"false\"')}</div>`;
  } else if (youtubeIds.length > 0) {
    const videoId = youtubeIds[0];
    mediaHTML = `<div class="w-full my-2"><iframe class="w-full h-[230px] rounded-[10px]"
      src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allowfullscreen></iframe></div>`;
  } else if (imageTags.length > 0) {
    mediaHTML = `<div class="quill-image-wrapper">${imageTags[0]}</div>`;
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  let titleHTML = '';
  const isMediaElem = (elem) => {
    if (!elem || elem.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = elem.tagName.toUpperCase();
    return (
      tag === 'IMG' ||
      tag === 'VIDEO' ||
      tag === 'IFRAME' ||
      (tag === 'DIV' && elem.classList.contains('quill-image-wrapper'))
    );
  };
  let firstNonMediaElem = null;
  for (let node of Array.from(tempDiv.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && !isMediaElem(node)) {
      firstNonMediaElem = node;
      break;
    }
  }
  if (firstNonMediaElem) {
    titleHTML = firstNonMediaElem.outerHTML;
    firstNonMediaElem.remove();
  }

  if (mediaHTML) {
    return `
      <div class="post-preview">
        ${titleHTML}
        <div>${mediaHTML}</div>
      </div>
    `;
  } else {
    return `
      <div class="post-preview">
        ${titleHTML}
        <div class="post-content max-h-[100px] overflow-hidden relative">
          ${tempDiv.innerHTML}
        </div>
      </div>
    `;
  }
};


export const formatTextCleanlyPreservingMedia = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const cleaned = formatTextCleanly(child.textContent);
        const span = document.createElement('span');
        span.innerHTML = cleaned;
        child.replaceWith(span);
      } else if (child.nodeType === Node.ELEMENT_NODE && !['IFRAME', 'IMG', 'VIDEO'].includes(child.tagName)) {
        walk(child);
      }
    });
  };
  walk(div);
  return div.innerHTML;
};

export const formatTextCleanly = (input) => {
  return input
    .replace(/\. ?/g, '.<br>')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])(?=\S)/g, '$1 ')
    .replace(/(https?:\/\/[^\s]+)/g, '\n$1')
    .replace(/\n{2,}/g, '\n\n')
    .replace(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
      (_, videoId) =>
        `<br><iframe 
          class="w-full h-[230px] rounded-[10px] my-2" 
          src="https://www.youtube.com/embed/${videoId}" 
          frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen></iframe><br>`
    )
    .trim();
};

export const cleanHtmlTextContent = (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const walkTextNodes = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const span = document.createElement('span');
      span.innerHTML = formatTextCleanly(node.textContent);
      node.parentNode.replaceChild(span, node);
    } else {
      node.childNodes.forEach(walkTextNodes);
    }
  };

  walkTextNodes(tempDiv);
  console.log('tempDiv',tempDiv.innerHTML);
  return tempDiv.innerHTML;
};

export const convertToWebp = (file) => {
  return new Promise((res, rej) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return rej('Canvas context error');

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (webpBlob) => {
          if (!webpBlob) return rej('WebP conversion failed');

          const webpSizeKB = (webpBlob.size / 1024).toFixed(2);
          const webpSizeMB = (webpBlob.size / 1024 / 1024).toFixed(2);

          const webpReader = new FileReader();
          webpReader.onloadend = () => {
            res({
              dataUrl: webpReader.result,
              originalSize: file.size,
              webpSize: webpBlob.size,
              readableOriginal: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(2)} KB`,
              readableWebp: webpBlob.size > 1024 * 1024 ? `${webpSizeMB} MB` : `${webpSizeKB} KB`,
            });
          };

          webpReader.readAsDataURL(webpBlob);
        },
        'image/webp',
        0.8
      );
    };

    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
};

export const compressVideoClientSide = (file) => {
  return new Promise((res, rej) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const targetWidth = 320;
      canvas.width = targetWidth;
      canvas.height = Math.round(targetWidth / aspectRatio);

      const fps = 15;
      const stream = canvas.captureStream(fps);

      const options = {
        mimeType: 'video/webm; codecs=vp8',
        videoBitsPerSecond: 100_000,
      };

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        res(compressedBlob);
      };

      recorder.onerror = (e) => {
        console.error('Recorder error:', e.error);
        rej(e.error);
      };

      recorder.start(100); // Increase the interval between data collection to speed up

      video.play();

      const drawFrame = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (!video.paused && !video.ended) {
          // Skip frames by not using requestAnimationFrame for every frame
          if (Math.random() > 0.7) { // Draw 30% of the frames
            requestAnimationFrame(drawFrame);
          }
        }
      };
      drawFrame();

      video.onended = () => {
        recorder.stop();
        video.pause();
        video.src = '';
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        console.error('Error loading video.');
        rej(new Error('Failed to load video'));
      };
    };
  });
};

export const enhanceVideoQualityClientSide = (file) => {
  return new Promise((res, rej) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const targetWidth = 1080; // Set higher resolution for better quality
      canvas.width = targetWidth;
      canvas.height = Math.round(targetWidth / aspectRatio);

      const fps = 30; // You can increase FPS for smoother playback
      const stream = canvas.captureStream(fps);

      // Video quality options
      const options = {
        mimeType: 'video/webm; codecs=vp9', // Use VP9 for better quality
        videoBitsPerSecond: 5000000, // Increase bitrate for better quality
      };

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const enhancedBlob = new Blob(chunks, { type: 'video/webm' });
        res(enhancedBlob);
      };

      recorder.onerror = (e) => {
        console.error('Recorder error:', e.error);
        rej(e.error);
      };

      recorder.start(500);

      video.play();

      const drawFrame = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (!video.paused && !video.ended) {
          requestAnimationFrame(drawFrame);
        }
      };
      drawFrame();

      video.onended = () => {
        recorder.stop();
        video.pause();
        video.src = '';
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        console.error('Error loading video.');
        rej(new Error('Failed to load video'));
      };
    };
  });
};

let serverTimeOffset = null;

export const getServerTime = async () => {
  if (serverTimeOffset !== null) {
    return new Date(Date.now() + serverTimeOffset);
  }

  const localTime = new Date();
  const tempRef = doc(db, 'utils', 'server-time');
  await setDoc(tempRef, { time: serverTimestamp() });
  const snapshot = await getDoc(tempRef);

  const serverTime = snapshot.data()?.time?.toDate?.();
  if (!serverTime) throw new Error('Server time fetch failed');

  serverTimeOffset = serverTime.getTime() - localTime.getTime();
  return new Date(Date.now() + serverTimeOffset);
} 

export const sendMessage=(me,to,message)=>{
  return new Promise(async (res, rej) => {
    if(to==null){
        rej();
        return;
    } 
    try {
      let dms=to.dms;
      if(!dms) dms=[]
      dms=dms.filter(d=>d.id==me.id)
      let time=await getServerTime();
      const userRef = doc(db, "users", to.id);
      let userDoc=await getDoc(userRef)
      if(dms.length==0)
      {
        let new_item={id:me.id,email:me.email,state:"new",lastTime: time.getTime()}
        await updateDoc(userRef,{dms: arrayUnion(new_item)})
      }else
      {
        // if(dms[0].state=="new"){
        //   alert("Your first message was not accepted.")
        //   rej();
        //   return
        // }
        if(dms[0].state=="block"){
          alert("Your message was declined.")
          rej();
          return
        }
        let newDms=userDoc.data().dms.map(d=>d.id==to.id?{...d,state:'show',timestamp: serverTimestamp()}:d)
        await updateDoc(userRef,{dms: newDms})
      }

      let data=userDoc.data();
      if(!data.blocks) data.blocks=[]
      if(data.blocks.includes(me.id))
      {
        alert(`${data.username} blocked you`);
        rej();
        return;
      }
      await addDoc(collection(db, 'messages'), {
        actionId:me.id,
        from: me.id ,
        to: to.id,
        action:'send',
        what:'message',
        type:'dm',
        message,
        read:0,
        timestamp: serverTimestamp(),
      })
      res();
    } catch (error) {
        console.log(error);
        rej();
        
    }

  })
    
}
 
export const getFireStoreUrl = (path) => {
  return new Promise(async (res, rej) => {
    let coll1 = collection(db, 'firestore_url')
    const q1 = query(coll1, where('firestore','==',path))
    const snap1 = await getDocs(q1)
    let data=[]
    snap1.forEach((doc) => {
      data.push(doc.data())
    })
    if(data.length==0) {
      const gsReference = storageRef(storage, 'gs://'+storageBucket+'/'+path);
      getDownloadURL(gsReference).then(url=>{
        addDoc(collection(db, 'firestore_url'), {
          firestore:path,
          url
        })
        res(url)
      }).catch(err=>{
        console.log(err);
        rej(err)
      })
    } else {
      res(data[0].url)
    }
    
  })
}

export const formatLastSeen = (user) => {
  // if (!user || !user.status) return 'Offline';

  // if (user.status === 'online') {
  //   return 'Online';
  // }

  // if (user.status === 'away') {
  //   return 'Away';
  // }

  const now = Date.now();

  let lastSeenTime = null;
  if (user.lastTime) {
    lastSeenTime = user.lastTime;
  } else if (user.createdAt?.seconds) {
    lastSeenTime = user.createdAt.seconds * 1000;
  }

  if (!lastSeenTime) return 'Offline';

  const diffMs = now - lastSeenTime;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Last seen just now';
  } else if (diffMinutes < 60) {
    return `Last seen ${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `Last seen ${hours}h ago`;
  } else if (diffMinutes < 7 * 1440) {
    const days = Math.floor(diffMinutes / 1440);
    return `Last seen ${days}d ago`;
  } else {
    // const date = new Date(lastSeenTime);
    // const formatted = date.toLocaleDateString('en-US', {
    //   month: 'short',
    //   day: 'numeric',
    //   year: 'numeric',
    // });
    // return `Last seen on ${formatted}`;
  }
};

export const addKeywordsToExistingPost = (post) => {
  if (post.keywords && post.keywords.length > 0) {
    return post.keywords;
  }
  return extractKeywords(post.contentHtml || '', post.tags || [], post.address || '');
};