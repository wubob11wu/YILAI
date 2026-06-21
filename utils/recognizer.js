function recognizeImage(tempFilePath) {
  return {
    image: tempFilePath,
    recognitionStatus: "manual_required"
  };
}

module.exports = {
  recognizeImage
};
