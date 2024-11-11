const { storageService } = require('../../../services/storage');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { id } = req.query;

    try {
      const artwork = await storageService.getArtwork(id);
      
      if (!artwork) {
        return res.status(404).json({ 
          success: false,
          message: 'Artwork not found' 
        });
      }
      
      return res.status(200).json(artwork);
    } catch (error) {
      console.error('Artwork API Error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 