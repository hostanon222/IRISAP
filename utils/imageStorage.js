const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function saveImage(base64Data, filename) {
  try {
    // Remove the data URL prefix
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    // Create a unique filename
    const uniqueFilename = `${Date.now()}-${filename}.png`;
    const filepath = path.join(uploadsDir, uniqueFilename);
    
    // Save the file
    await fs.promises.writeFile(filepath, buffer);
    
    // Return the public URL
    return `/uploads/${uniqueFilename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
}

module.exports = {
  saveImage
}; 