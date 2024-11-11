const { storageService } = require('../../services/storage');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('📊 Fetching artworks from database...');
      const artworks = await storageService.getArtworks();
      
      if (!artworks) {
        console.log('⚠️ No artworks found in database');
        return res.status(200).json({ 
          success: true,
          artworks: [] 
        });
      }
      
      console.log(`✅ Successfully retrieved ${artworks.length} artworks`);
      return res.status(200).json({
        success: true,
        artworks: artworks
      });

    } catch (error) {
      console.error('❌ Gallery API Error:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Internal server error',
        artworks: [] 
      });
    }
  }

  return res.status(405).json({ 
    success: false,
    message: 'Method not allowed' 
  });
} 