import { useState, useRef } from "react";
import NavBar from "../components/Navbar";
import axios from "axios";

const Home = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);
  const [damageLocations, setDamageLocations] = useState([]);
  const videoRef = useRef(null);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleScan = async () => {
    if (!file) {
      alert("Please upload a video file first.");
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await axios.post("http://localhost:5000/process_video", formData);
      setOutputVideoUrl("/public/Output.mp4");

      if (response.data.locations) {
        console.log(damageLocations)
        setDamageLocations(response.data.locations);
      } else {
        setDamageLocations([]);
      }
    } catch (error) {
      console.error("Error processing video:", error);
      alert("Error processing video. Please try again.");
    }
    setProcessing(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <NavBar />
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 p-6 h-full">
        {/* Upload Section */}
        <div className="w-full md:w-1/2 p-6 bg-white shadow-lg rounded-xl border overflow-hidden h-full flex flex-col justify-center">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-lg p-6 cursor-pointer bg-gray-50 hover:bg-gray-100">
            <span className="text-gray-600">Click to Upload or Drag & Drop</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
          </label>

          {previewUrl && (
            <div className="mt-4 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold">Uploaded Video</h3>
              <video controls className="mt-2 rounded-lg flex-grow object-contain h-[400px]">
                <source src={previewUrl} type="video/mp4" />
              </video>
              <button
                className="bg-blue-600 w-full text-white py-2 mt-3 rounded-lg hover:bg-blue-500"
                onClick={handleScan}
                disabled={processing}
              >
                {processing ? "Processing..." : "Scan"}
              </button>
            </div>
          )}
        </div>

        {/* Processed Video Section */}
        <div className="w-full md:w-1/2 p-6 bg-white shadow-lg rounded-xl border overflow-hidden h-full flex flex-col justify-center">
          {processing ? (
            <p className="text-center text-lg font-semibold">Processing video...</p>
          ) : outputVideoUrl ? (
            <>
              <h3 className="text-lg font-semibold mb-4">Processed Video</h3>
              <video ref={videoRef} controls className="flex-grow object-contain h-[400px]">
                <source src={outputVideoUrl} type="video/mp4" />
              </video>
              <a href={outputVideoUrl} download="processed_video.mp4">
                <button className="bg-green-500 px-4 py-2 rounded-lg text-white mt-3 w-full">Download Video</button>
              </a>
              {damageLocations.length > 0 ? (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold">Damage Locations</h4>
                  <ul className="list-disc list-inside">
                    {damageLocations.map((loc, index) => (
                      <li key={index} className="text-blue-600">
                        📍 {loc.latitude}, {loc.longitude} (Time: {loc.timestamp})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-center mt-4">No damage detected.</p>
              )}
            </>
          ) : (
            <p className="text-center">No processed video yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;