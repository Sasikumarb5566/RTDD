import { useState, useRef } from "react";
import NavBar from "../components/Navbar";
import axios from "axios";
import Loading from '../assets/Loading.gif'

const Home = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const videoRef = useRef(null);
  const locationRef = useRef(null);

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
      const response = await axios.post(
        "http://localhost:5000/process_video",
        formData
      );
      setOutputVideoUrl(response.data.output_video);
      setLocationData(response.data.location_data);
    } catch (error) {
      console.error("Error processing video:", error);
      alert("Error processing video. Please try again.");
    }
    setProcessing(false);
  };

  const handleLocationClick = (latitude, longitude) => {
    setSelectedLocation({ latitude, longitude });
    locationRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <NavBar />
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 p-6 h-full">
        {/* Upload Section */}
        <div className="w-full md:w-1/2 p-6 bg-white shadow-lg rounded-xl border overflow-hidden h-full flex flex-col justify-center">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-lg p-6 cursor-pointer bg-gray-50 hover:bg-gray-100">
            <span className="text-gray-600">
              Click to Upload or Drag & Drop
            </span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {previewUrl && (
            <div className="mt-4 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold">Uploaded Video</h3>
              <video
                controls
                className="mt-2 rounded-lg flex-grow object-contain h-[400px]"
              >
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
            <p className="text-center text-lg font-semibold flex items-center justify-center flex-col">
              <img src={Loading} alt="" className="w-1/4" />
              <p className="text-2xl text-center">Processing your video...</p>
            </p>
          ) : outputVideoUrl ? (
            <>
              <h3 className="text-lg font-semibold mb-4">Processed Video</h3>
              <video
                ref={videoRef}
                controls
                className="flex-grow object-contain h-[400px]"
              >
                <source src={outputVideoUrl} type="video/webm" />
              </video>
              <a href={outputVideoUrl} download="processed_video.webm">
                <button className="bg-green-500 px-4 py-2 rounded-lg text-white mt-3 w-full">
                  Download Video
                </button>
              </a>
            </>
          ) : (
            <p className="text-center">No processed video yet.</p>
          )}
        </div>
      </div>
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-8">
        <div className="flex flex-col md:flex-row gap-8 w-full  h-full">
          {/* Location Data Section */}
          <div className="w-full p-6 bg-white shadow-2xl rounded-2xl border overflow-auto">
            {locationData ? (
              <>
                <h4 className="text-2xl font-semibold mb-4 text-gray-800">
                  Location Data
                </h4>
                {locationData.error ? (
                  <p className="text-red-500 text-lg">{locationData.error}</p>
                ) : Array.isArray(locationData) ? (
                  <ul className="space-y-3">
                    {locationData.map((loc, index) =>
                      loc &&
                      typeof loc === "object" &&
                      "latitude" in loc &&
                      "longitude" in loc ? (
                        <li
                          key={index}
                          className={`cursor-pointer text-lg hover:underline p-3 rounded-lg ${
                            selectedLocation &&
                            selectedLocation.latitude === loc.latitude &&
                            selectedLocation.longitude === loc.longitude
                              ? "bg-blue-600 text-white"
                              : "bg-white"
                          }`}
                          onClick={() =>
                            handleLocationClick(loc.latitude, loc.longitude)
                          }
                        >
                          📍 Latitude: {loc.latitude}, Longitude:{" "}
                          {loc.longitude}
                        </li>
                      ) : (
                        <li key={index} className="text-red-500">
                          Invalid location data
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-lg">
                    Unexpected location data format
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-600 text-lg">
                No location data available.
              </p>
            )}
          </div>

          {/* Google Map Section */}
          <div className="w-full p-6 bg-white shadow-2xl rounded-2xl border">
            {selectedLocation ? (
              <div ref={locationRef} className="w-full h-[80vh]">
                <p className="text-xl font-semibold mb-4 text-gray-800">
                  Damaged Track Location
                </p>
                <iframe
                  title="Google Maps"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  allowFullScreen
                  className="rounded-lg border"
                  src={`https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}&hl=es;z=14&output=embed`}
                ></iframe>
              </div>
            ) : (
              <p className="text-gray-600 text-lg">
                Select a location to view on the map.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
