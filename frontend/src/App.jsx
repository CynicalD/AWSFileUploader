import { useState } from 'react';
import axios from 'axios';

function App() {
  // 1. Check localStorage first! This survives page reloads.
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // New state for a smooth UI message instead of annoying alerts
  const [statusMessage, setStatusMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // --- 1. Handle Login / Registration ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setStatusMessage(''); // Clear old messages
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post('http://localhost:8080/api/v1/users/auth', formData);

      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data)); // Save to browser storage!
      setStatusMessage(''); // Clear any errors
    } catch (error) {
      console.error("Auth failed:", error);
      setStatusMessage("Login failed. Check password.");
    }
  };

  // --- 2. Handle File Selection ---
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setStatusMessage(''); // Clear old messages when picking a new file
  };

  // --- 3. Handle File Upload ---
  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMessage("Please select a file first!");
      return;
    }

    setIsUploading(true);
    setStatusMessage("Uploading to cloud...");

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`http://localhost:8080/api/v1/users/${user.id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update state AND localStorage with the brand new file list
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));

      setStatusMessage("Upload successful!");

      // Reset the file input so it's ready for the next one
      setSelectedFile(null);
      document.getElementById('fileUploader').value = '';
    } catch (error) {
      console.error("Upload failed:", error);
      setStatusMessage("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- 4. Handle Logout ---
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Wipe the saved data
    setUsername('');
    setPassword('');
    setStatusMessage('');
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

              {/* Smooth status message instead of alert */}
              {statusMessage && <p style={{ color: 'red', fontWeight: 'bold' }}>{statusMessage}</p>}
            </form>
        ) : (
            /* Show Dashboard if user IS logged in */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2>Welcome to your Dashboard, {user.username}</h2>

              <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                <h3>Upload a New File to S3</h3>
                <input id="fileUploader" type="file" onChange={handleFileChange} />
                <button onClick={handleUpload} disabled={isUploading} style={{ marginTop: '10px' }}>
                  {isUploading ? "Uploading..." : "Upload to Cloud"}
                </button>

                {/* Smoother success message not them ugly ass alerts */}
                {statusMessage && <p style={{ color: statusMessage.includes('successful') ? 'green' : 'red', marginTop: '10px' }}>{statusMessage}</p>}
              </div>

              <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                <h3>Your Cloud Gallery</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>

                  {user.files && user.files.map((file) => (
                      <div key={file.id} style={{ textAlign: 'center' }}>
                        <img
                            src={`http://localhost:8080/api/v1/users/files/${file.s3Key}`}
                            alt={file.originalFileName}
                            style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <p style={{ fontSize: '12px', marginTop: '8px', fontWeight: 'bold', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.originalFileName}
                        </p>
                      </div>
                  ))}

                  {(!user.files || user.files.length === 0) && <p>No files uploaded yet.</p>}
                </div>
              </div>

              <button onClick={handleLogout}>Log Out</button>
            </div>
        )}
      </div>
  );
}

export default App;