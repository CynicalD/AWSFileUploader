import { useState } from 'react';
import axios from 'axios';

function App() {
  // State for Authentication
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null); // Holds our logged-in user data

  // State for File Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now()); // Hack to force image reload

  // 1. Handle Login / Registration
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      // This is the exact equivalent of your first curl command!
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post('http://localhost:8080/api/v1/users/auth', formData);
      setUser(response.data);
      alert(`Welcome, ${response.data.username}!`);
    } catch (error) {
      console.error("Auth failed:", error);
      alert("Login failed. Check password.");
    }
  };

  // 2. Handle File Selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // 3. Handle File Upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Equivalent to your second curl command
      await axios.post(`http://localhost:8080/api/v1/users/${user.id}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert("Image uploaded to S3 successfully!");
      // Update timestamp to force the browser to fetch the new image instead of using cache
      setImageTimestamp(Date.now());
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image.");
    }
  };

  // --- RENDERING THE UI ---
  return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h1>AWS File Uploader</h1>

        {/* Show Login Form if NO user is logged in */}
        {!user ? (
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2>Login / Register</h2>
              <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
              />
              <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
              />
              <button type="submit">Authenticate</button>
            </form>
        ) : (
            /* Show Dashboard if user IS logged in */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2>Welcome to your Dashboard, {user.username}</h2>

              <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                <h3>Upload a New File to S3</h3>
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleUpload} style={{ marginTop: '10px' }}>Upload to Cloud</button>
              </div>

              <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                <h3>Your Cloud Image</h3>
                {/* We append a timestamp to the URL so the browser knows it's a "new" image and bypasses cache */}
                <img
                    src={`http://localhost:8080/api/v1/users/${user.id}/profile-image?t=${imageTimestamp}`}
                    alt="User Profile"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    onError={(e) => { e.target.style.display = 'none'; }} // Hide if no image exists yet
                    onLoad={(e) => { e.target.style.display = 'block'; }}
                />
              </div>

              <button onClick={() => setUser(null)}>Log Out</button>
            </div>
        )}
      </div>
  );
}

export default App;