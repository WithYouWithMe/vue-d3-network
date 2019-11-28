export default {
  save(img, name) {
    if (img) {
      img = this.dataURIToBlob(img, blob => {
        const url = URL.createObjectURL(blob);
        this.download(url, name);
      });
    }
  },
  dataURIToBlob(dataURI, cb) {
    const binStr = atob(dataURI.split(",")[1]);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }
    cb(new Blob([arr]));
  },
  download(url, name) {
    name = name || "";
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", name);
    const el = document.body.appendChild(link);
    link.click();
    document.body.removeChild(el);
  },
};
